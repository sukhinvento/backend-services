import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaService, KafkaMessage } from '@kafka/kafka.service';
import { InvoicesService } from './invoices.service';

@Injectable()
export class InvoicesEventHandler implements OnModuleInit {
  private readonly logger = new Logger(InvoicesEventHandler.name);

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly invoicesService: InvoicesService,
  ) {}

  async onModuleInit() {
    await this.initializeConsumer();
  }

  private async initializeConsumer() {
    try {
      // Ensure the topic exists
      await this.kafkaService.ensureTopicExists('billing-events', 1, 1);

      // Create consumer for purchase and sales order events
      await this.kafkaService.createConsumer(
        'invoice-event-group',
        ['billing-events'],
        this.handleEvent.bind(this),
      );

      this.logger.log('Invoices event handler initialized');
    } catch (error) {
      this.logger.error('Failed to initialize invoices event handler', error);
      throw error;
    }
  }

  private async handleEvent(message: KafkaMessage) {
    try {
      switch (message.eventType) {
        case 'purchase_order.created':
          await this.handlePurchaseOrderCreated(message);
          break;
        case 'sales_order.created':
          await this.handleSalesOrderCreated(message);
          break;
        case 'diagnostic.completed':
          await this.handleDiagnosticCompleted(message);
          break;
        case 'patient.discharge.completed':
          await this.handlePatientDischarge(message);
          break;
        default:
          this.logger.debug(`Ignoring event type: ${message.eventType}`);
      }
    } catch (error) {
      this.logger.error(`Error handling event: ${message.eventType}`, error);
    }
  }

  /**
   * Normalise items from PO/SO format to invoice line-item format.
   * PO items use `qty`, SO items may use `quantity`. Both need handling.
   */
  private normaliseItems(rawItems: any[]): any[] {
    return rawItems.map((item, idx) => {
      const qty = item.quantity ?? item.qty ?? 1;
      const unitPrice = item.unit_price ?? item.unitPrice ?? item.price ?? 0;
      const discountPercent = item.discount_percent ?? item.discount ?? 0;
      const taxSlab = item.tax_slab ?? item.taxSlab ?? 0;

      const lineSubtotal = qty * unitPrice;
      const discountAmount = lineSubtotal * (discountPercent / 100);
      const taxableAmount = lineSubtotal - discountAmount;
      const taxAmount = taxableAmount * (taxSlab / 100);
      const lineTotal = taxableAmount + taxAmount;

      return {
        name: item.name || item.description || `Item ${idx + 1}`,
        sku: item.sku || item.item_id || '',
        quantity: qty,
        unit_price: unitPrice,
        discount_percent: discountPercent,
        tax_slab: taxSlab,
        tax_amount: Math.round(taxAmount * 100) / 100,
        subtotal: Math.round(taxableAmount * 100) / 100,
        total: Math.round(lineTotal * 100) / 100,
        sale_unit: item.sale_unit || item.unit || '',
      };
    });
  }

  /**
   * Calculate totals and GST breakdown (CGST + SGST per slab) from normalised items.
   */
  private calculateTotals(items: any[]) {
    let subtotal = 0;
    let total_tax = 0;
    let total_discount = 0;

    // Group by tax slab for GST breakdown
    const slabMap = new Map<number, { taxable: number; tax: number }>();

    for (const item of items) {
      const qty = item.quantity ?? 1;
      const price = item.unit_price ?? 0;
      const lineSubtotal = qty * price;
      const discountPercent = item.discount_percent ?? 0;
      const discountAmount = lineSubtotal * (discountPercent / 100);
      const taxableAmount = lineSubtotal - discountAmount;
      const taxSlab = item.tax_slab ?? 0;
      const taxAmount = item.tax_amount ?? (taxableAmount * taxSlab / 100);

      subtotal += taxableAmount;
      total_discount += discountAmount;
      total_tax += taxAmount;

      if (taxSlab > 0) {
        const existing = slabMap.get(taxSlab) || { taxable: 0, tax: 0 };
        existing.taxable += taxableAmount;
        existing.tax += taxAmount;
        slabMap.set(taxSlab, existing);
      }
    }

    // Build tax_breakdown array
    const tax_breakdown: any[] = [];
    for (const [rate, { taxable, tax }] of slabMap.entries()) {
      const half = Math.round((tax / 2) * 100) / 100;
      tax_breakdown.push({
        rate,
        taxable_amount: Math.round(taxable * 100) / 100,
        cgst: half,
        sgst: half,
        total_tax: Math.round(tax * 100) / 100,
      });
    }
    tax_breakdown.sort((a, b) => a.rate - b.rate);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      total_tax: Math.round(total_tax * 100) / 100,
      total_discount: Math.round(total_discount * 100) / 100,
      amount: Math.round((subtotal + total_tax) * 100) / 100,
      tax_breakdown,
    };
  }

  private async handlePurchaseOrderCreated(event: KafkaMessage) {
    try {
      const rawItems = event.items || [];
      const items = this.normaliseItems(rawItems);
      const totals = items.length > 0
        ? this.calculateTotals(items)
        : { subtotal: event.amount || 0, total_tax: 0, total_discount: 0, amount: event.amount || 0, tax_breakdown: [] };

      const invoiceDto = {
        order_id: event.entity_id,
        items,
        subtotal: totals.subtotal,
        total_tax: totals.total_tax,
        total_discount: totals.total_discount,
        amount: totals.amount,
        tax_breakdown: totals.tax_breakdown,
        status: 'draft',
        source_type: event.entity_type,
        source_number: event.po_number,
        // Vendor details
        vendor_name: event.vendor_name,
        vendor_id: event.vendor_id,
        vendor_phone: event.vendor_phone || '',
        vendor_email: event.vendor_email || '',
        vendor_address: event.vendor_address || '',
        // Order metadata
        order_date: event.order_date || event.timestamp,
        delivery_date: event.delivery_date || '',
        payment_method: event.payment_method || '',
        shipping_address: event.shipping_address || '',
        notes: event.notes || '',
        custom_fields: {
          source_type: event.entity_type,
          source_number: event.po_number,
          vendor_name: event.vendor_name,
          vendor_id: event.vendor_id,
        },
      };

      const invoice = await this.invoicesService.create(
        invoiceDto,
        event.createdBy,
        event.tenantId,
      );

      this.logger.log(
        `Invoice created for PO ${event.po_number}: ${invoice.id} with ${items.length} items, GST slabs: ${totals.tax_breakdown.length}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create invoice for PO ${event.po_number}`,
        error,
      );
    }
  }

  private async handleSalesOrderCreated(event: KafkaMessage) {
    try {
      const rawItems = event.items || [];
      const items = this.normaliseItems(rawItems);
      const totals = items.length > 0
        ? this.calculateTotals(items)
        : { subtotal: event.amount || 0, total_tax: 0, total_discount: 0, amount: event.amount || 0, tax_breakdown: [] };

      const invoiceDto = {
        order_id: event.entity_id,
        items,
        subtotal: totals.subtotal,
        total_tax: totals.total_tax,
        total_discount: totals.total_discount,
        amount: totals.amount,
        tax_breakdown: totals.tax_breakdown,
        status: 'draft',
        source_type: event.entity_type,
        source_number: event.so_number,
        // Customer details
        customer_name: event.customer_name,
        customer_id: event.customer_id,
        customer_phone: event.customer_phone || '',
        customer_email: event.customer_email || '',
        customer_address: event.customer_address || '',
        // Order metadata
        order_date: event.order_date || event.timestamp,
        delivery_date: event.delivery_date || '',
        payment_method: event.payment_method || '',
        shipping_address: event.shipping_address || '',
        notes: event.notes || '',
        custom_fields: {
          source_type: event.entity_type,
          source_number: event.so_number,
          customer_name: event.customer_name,
          customer_id: event.customer_id,
        },
      };

      const invoice = await this.invoicesService.create(
        invoiceDto,
        event.createdBy,
        event.tenantId,
      );

      this.logger.log(
        `Invoice created for SO ${event.so_number}: ${invoice.id} with ${items.length} items, GST slabs: ${totals.tax_breakdown.length}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create invoice for SO ${event.so_number}`,
        error,
      );
    }
  }

  private async handleDiagnosticCompleted(event: KafkaMessage) {
    try {
      const items = event.items || [
        {
          name: event.test_name,
          description: `Diagnostic Test`,
          quantity: 1,
          unit_price: event.price || 0,
          subtotal: event.price || 0,
          total: event.price || 0,
        },
      ];

      const invoiceDto = {
        order_id: event.entity_id,
        items,
        subtotal: event.price || 0,
        amount: event.price || 0,
        status: 'draft',
        source_type: 'diagnostic_booking',
        source_number: event.booking_number,
        customer_name: event.patient_name || '',
        customer_id: event.patient_id || '',
        order_date: event.timestamp,
        custom_fields: {
          source_type: 'diagnostic_booking',
          source_number: event.booking_number,
          patient_id: event.patient_id,
          test_name: event.test_name,
        },
      };

      const invoice = await this.invoicesService.create(
        invoiceDto,
        event.createdBy,
        event.tenantId,
      );

      this.logger.log(
        `Invoice created for diagnostic ${event.booking_number}: ${invoice.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create invoice for diagnostic ${event.booking_number}`,
        error,
      );
    }
  }

  private async handlePatientDischarge(event: KafkaMessage) {
    try {
      const items = event.items || [
        {
          name: 'Room Charges',
          description: 'Admission room charges',
          quantity: 1,
          unit_price: event.room_charges || 0,
          subtotal: event.room_charges || 0,
          total: event.room_charges || 0,
        },
      ];

      const invoiceDto = {
        order_id: event.admission_id || event.entity_id,
        items,
        subtotal: event.room_charges || 0,
        amount: event.room_charges || 0,
        status: 'draft',
        source_type: 'admission',
        source_number: event.admission_number,
        customer_name: event.patient_name || '',
        customer_id: event.patient_id || '',
        order_date: event.timestamp,
        custom_fields: {
          source_type: 'admission',
          source_number: event.admission_number,
          patient_id: event.patient_id,
        },
      };

      const invoice = await this.invoicesService.create(
        invoiceDto,
        event.createdBy,
        event.tenantId,
      );

      this.logger.log(
        `Invoice created for discharge ${event.admission_number}: ${invoice.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create invoice for discharge ${event.admission_number}`,
        error,
      );
    }
  }
}
