import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaService, KafkaMessage } from '@kafka/kafka.service';
import { InvoicesService } from './invoices.service';
import { TenantsService } from '@tenants/tenants.service';

// ── Healthcare SAC codes (standard India GST) ────────────────────────────────
const HEALTHCARE_SAC = {
  consultation:  '999311',   // Medical consultation services
  diagnostic:    '999315',   // Diagnostic tests
  room_charges:  '999311',   // In-patient hospital services
  surgical:      '999312',   // Surgical procedures
  pharmacy:      '21069099', // HSN for pharmaceutical preparations (goods)
};

@Injectable()
export class InvoicesEventHandler implements OnModuleInit {
  private readonly logger = new Logger(InvoicesEventHandler.name);

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly invoicesService: InvoicesService,
    private readonly tenantsService: TenantsService,
  ) {}

  async onModuleInit() {
    await this.initializeConsumer();
  }

  // ── Kafka consumer ──────────────────────────────────────────────────────
  private async initializeConsumer() {
    try {
      await this.kafkaService.ensureTopicExists('billing-events', 1, 1);
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
        case 'purchase_order.created':  await this.handlePurchaseOrderCreated(message); break;
        case 'sales_order.created':     await this.handleSalesOrderCreated(message);    break;
        case 'diagnostic.completed':    await this.handleDiagnosticCompleted(message);  break;
        case 'patient.discharge.completed': await this.handlePatientDischarge(message); break;
        default: this.logger.debug(`Ignoring event type: ${message.eventType}`);
      }
    } catch (error) {
      this.logger.error(`Error handling event: ${message.eventType}`, error);
    }
  }

  // ── Helper: get seller GSTIN + state_code from tenant ──────────────────
  private async getTenantGstInfo(tenantId: string): Promise<{ gstin: string; stateCode: string }> {
    try {
      const tenant = await this.tenantsService.findByTenantId(tenantId);
      return {
        gstin:     (tenant as any)?.gstin      || '',
        stateCode: (tenant as any)?.state_code || '',
      };
    } catch {
      return { gstin: '', stateCode: '' };
    }
  }

  // ── Helper: determine if transaction is inter-state ─────────────────────
  private isInterState(sellerStateCode: string, buyerStateCode: string): boolean {
    if (!sellerStateCode || !buyerStateCode) return false;
    return sellerStateCode.trim() !== buyerStateCode.trim();
  }

  /**
   * Normalise PO / SO items → invoice line items.
   * Carries HSN / SAC codes for GST reporting.
   */
  private normaliseItems(rawItems: any[], defaultHsnCode = ''): any[] {
    return rawItems.map((item, idx) => {
      const qty           = item.quantity ?? item.qty ?? 1;
      const unitPrice     = item.unit_price ?? item.unitPrice ?? item.price ?? 0;
      const discountPct   = item.discount_percent ?? item.discount ?? 0;
      const taxSlab       = item.tax_slab ?? item.taxSlab ?? 0;
      const hsnCode       = item.hsn_code ?? item.hsn ?? item.sac_code ?? defaultHsnCode;

      const lineSubtotal  = qty * unitPrice;
      const discountAmt   = lineSubtotal * (discountPct / 100);
      const taxableAmount = lineSubtotal - discountAmt;
      const taxAmount     = taxableAmount * (taxSlab / 100);
      const lineTotal     = taxableAmount + taxAmount;

      return {
        name:            item.name || item.description || `Item ${idx + 1}`,
        sku:             item.sku  || item.item_id || '',
        hsn_code:        hsnCode,
        quantity:        qty,
        unit_price:      unitPrice,
        discount_percent: discountPct,
        tax_slab:        taxSlab,
        tax_amount:      Math.round(taxAmount    * 100) / 100,
        subtotal:        Math.round(taxableAmount * 100) / 100,
        total:           Math.round(lineTotal     * 100) / 100,
        sale_unit:       item.sale_unit || item.unit || '',
      };
    });
  }

  /**
   * Calculate totals and build GST tax_breakdown per slab.
   * Automatically applies IGST (inter-state) or CGST+SGST (intra-state).
   *
   * tax_breakdown entry shape:
   *   { rate, taxable_amount, cgst, sgst, igst, total_tax }
   *   — cgst+sgst are set for intra-state; igst is set for inter-state
   */
  private calculateTotals(items: any[], isInterState = false) {
    let subtotal       = 0;
    let total_tax      = 0;
    let total_discount = 0;

    const slabMap = new Map<number, { taxable: number; tax: number }>();

    for (const item of items) {
      const qty           = item.quantity ?? 1;
      const price         = item.unit_price ?? 0;
      const lineSubtotal  = qty * price;
      const discountPct   = item.discount_percent ?? 0;
      const discountAmt   = lineSubtotal * (discountPct / 100);
      const taxableAmount = lineSubtotal - discountAmt;
      const taxSlab       = item.tax_slab ?? 0;
      const taxAmount     = item.tax_amount ?? (taxableAmount * taxSlab / 100);

      subtotal       += taxableAmount;
      total_discount += discountAmt;
      total_tax      += taxAmount;

      if (taxSlab > 0) {
        const prev = slabMap.get(taxSlab) || { taxable: 0, tax: 0 };
        prev.taxable += taxableAmount;
        prev.tax     += taxAmount;
        slabMap.set(taxSlab, prev);
      }
    }

    // Build tax_breakdown — IGST for inter-state, CGST+SGST for intra-state
    const tax_breakdown: any[] = [];
    for (const [rate, { taxable, tax }] of slabMap.entries()) {
      const rounded = (v: number) => Math.round(v * 100) / 100;
      if (isInterState) {
        tax_breakdown.push({
          rate,
          taxable_amount: rounded(taxable),
          cgst:      0,
          sgst:      0,
          igst:      rounded(tax),
          total_tax: rounded(tax),
        });
      } else {
        const half = rounded(tax / 2);
        tax_breakdown.push({
          rate,
          taxable_amount: rounded(taxable),
          cgst:      half,
          sgst:      half,
          igst:      0,
          total_tax: rounded(tax),
        });
      }
    }
    tax_breakdown.sort((a, b) => a.rate - b.rate);

    return {
      subtotal:       Math.round(subtotal       * 100) / 100,
      total_tax:      Math.round(total_tax      * 100) / 100,
      total_discount: Math.round(total_discount * 100) / 100,
      amount:         Math.round((subtotal + total_tax) * 100) / 100,
      tax_breakdown,
    };
  }

  // ── PO invoice ──────────────────────────────────────────────────────────
  private async handlePurchaseOrderCreated(event: KafkaMessage) {
    try {
      const { gstin: sellerGstin, stateCode: sellerState } =
        await this.getTenantGstInfo(event.tenantId);

      const buyerGstin     = event.vendor_gstin      || '';
      const buyerStateCode = event.vendor_state_code || '';
      const interState     = this.isInterState(sellerState, buyerStateCode);

      const items  = this.normaliseItems(event.items || []);
      const totals = items.length > 0
        ? this.calculateTotals(items, interState)
        : { subtotal: event.amount || 0, total_tax: 0, total_discount: 0, amount: event.amount || 0, tax_breakdown: [] };

      // Due date: delivery_date or 30 days from order_date
      const dueDate = event.delivery_date ||
        (event.order_date
          ? new Date(new Date(event.order_date).getTime() + 30 * 864e5).toISOString().split('T')[0]
          : '');

      await this.invoicesService.create({
        order_id:        event.entity_id,
        items,
        ...totals,
        status:          'draft',
        source_type:     event.entity_type,
        source_number:   event.po_number,
        // Vendor details
        vendor_name:     event.vendor_name,
        vendor_id:       event.vendor_id,
        vendor_phone:    event.vendor_phone    || '',
        vendor_email:    event.vendor_email    || '',
        vendor_address:  event.vendor_address  || '',
        // Order metadata
        order_date:      event.order_date    || event.timestamp,
        delivery_date:   event.delivery_date || '',
        due_date:        dueDate,
        payment_method:  event.payment_method  || '',
        shipping_address: event.shipping_address || '',
        notes:           event.notes || '',
        // GST
        seller_gstin:   sellerGstin,
        buyer_gstin:    buyerGstin,
        place_of_supply: buyerStateCode || sellerState,
        is_inter_state: interState,
        invoice_type:   'tax_invoice',
        custom_fields: {
          source_type: event.entity_type,
          source_number: event.po_number,
          vendor_name: event.vendor_name,
          vendor_id: event.vendor_id,
        },
      }, event.createdBy, event.tenantId);

      this.logger.log(
        `PO invoice created: ${event.po_number} | ₹${totals.amount} | ${interState ? 'IGST' : 'CGST+SGST'} | slabs: ${totals.tax_breakdown.length}`,
      );
    } catch (error) {
      this.logger.error(`Failed to create invoice for PO ${event.po_number}`, error);
    }
  }

  // ── SO invoice ──────────────────────────────────────────────────────────
  private async handleSalesOrderCreated(event: KafkaMessage) {
    try {
      const { gstin: sellerGstin, stateCode: sellerState } =
        await this.getTenantGstInfo(event.tenantId);

      const buyerGstin     = event.customer_gstin      || '';
      const buyerStateCode = event.customer_state_code || '';
      const interState     = this.isInterState(sellerState, buyerStateCode);

      const items  = this.normaliseItems(event.items || []);
      const totals = items.length > 0
        ? this.calculateTotals(items, interState)
        : { subtotal: event.amount || 0, total_tax: 0, total_discount: 0, amount: event.amount || 0, tax_breakdown: [] };

      const dueDate = event.due_date || event.delivery_date ||
        (event.order_date
          ? new Date(new Date(event.order_date).getTime() + 30 * 864e5).toISOString().split('T')[0]
          : '');

      await this.invoicesService.create({
        order_id:        event.entity_id,
        items,
        ...totals,
        status:          'draft',
        source_type:     event.entity_type,
        source_number:   event.so_number,
        // Customer details
        customer_name:    event.customer_name,
        customer_id:      event.customer_id,
        customer_phone:   event.customer_phone   || '',
        customer_email:   event.customer_email   || '',
        customer_address: event.customer_address || '',
        // Order metadata
        order_date:      event.order_date    || event.timestamp,
        delivery_date:   event.delivery_date || '',
        due_date:        dueDate,
        payment_method:  event.payment_method || '',
        shipping_address: event.shipping_address || '',
        notes:           event.notes || '',
        // GST
        seller_gstin:    sellerGstin,
        buyer_gstin:     buyerGstin,
        place_of_supply: buyerStateCode || sellerState,
        is_inter_state:  interState,
        invoice_type:    'tax_invoice',
        custom_fields: {
          source_type: event.entity_type,
          source_number: event.so_number,
          customer_name: event.customer_name,
          customer_id: event.customer_id,
        },
      }, event.createdBy, event.tenantId);

      this.logger.log(
        `SO invoice created: ${event.so_number} | ₹${totals.amount} | ${interState ? 'IGST' : 'CGST+SGST'}`,
      );
    } catch (error) {
      this.logger.error(`Failed to create invoice for SO ${event.so_number}`, error);
    }
  }

  // ── Diagnostic invoice ──────────────────────────────────────────────────
  private async handleDiagnosticCompleted(event: KafkaMessage) {
    try {
      const { gstin: sellerGstin, stateCode: sellerState } =
        await this.getTenantGstInfo(event.tenantId);

      // Healthcare diagnostic services are largely GST-exempt in India (0% for clinical tests)
      // SAC 999315 — pathology / diagnostic services
      const items = (event.items || []).length > 0
        ? this.normaliseItems(event.items, HEALTHCARE_SAC.diagnostic)
        : [{
            name:        event.test_name || 'Diagnostic Test',
            sku:         '',
            hsn_code:    HEALTHCARE_SAC.diagnostic,
            quantity:    1,
            unit_price:  event.price || 0,
            discount_percent: 0,
            tax_slab:    0,
            tax_amount:  0,
            subtotal:    event.price || 0,
            total:       event.price || 0,
            sale_unit:   'test',
          }];

      const totals = this.calculateTotals(items, false);

      await this.invoicesService.create({
        order_id:       event.entity_id,
        items,
        ...totals,
        status:         'draft',
        source_type:    'diagnostic_booking',
        source_number:  event.booking_number,
        customer_name:  event.patient_name || '',
        customer_id:    event.patient_id   || '',
        order_date:     event.timestamp,
        // GST
        seller_gstin:   sellerGstin,
        buyer_gstin:    '',                // patients typically not GST-registered
        place_of_supply: sellerState,
        is_inter_state: false,
        invoice_type:   'tax_invoice',
        custom_fields: {
          source_type: 'diagnostic_booking',
          source_number: event.booking_number,
          patient_id: event.patient_id,
          test_name: event.test_name,
        },
      }, event.createdBy, event.tenantId);

      this.logger.log(`Diagnostic invoice created: ${event.booking_number}`);
    } catch (error) {
      this.logger.error(`Failed to create invoice for diagnostic ${event.booking_number}`, error);
    }
  }

  // ── Patient discharge / admission invoice ───────────────────────────────
  private async handlePatientDischarge(event: KafkaMessage) {
    try {
      const { gstin: sellerGstin, stateCode: sellerState } =
        await this.getTenantGstInfo(event.tenantId);

      // SAC 999311 — in-patient hospital services (0% GST for clinical care in India)
      const items = (event.items || []).length > 0
        ? this.normaliseItems(event.items, HEALTHCARE_SAC.room_charges)
        : [{
            name:        'Room Charges',
            sku:         '',
            hsn_code:    HEALTHCARE_SAC.room_charges,
            quantity:    1,
            unit_price:  event.room_charges || 0,
            discount_percent: 0,
            tax_slab:    0,
            tax_amount:  0,
            subtotal:    event.room_charges || 0,
            total:       event.room_charges || 0,
            sale_unit:   'admission',
          }];

      const totals = this.calculateTotals(items, false);

      await this.invoicesService.create({
        order_id:       event.admission_id || event.entity_id,
        items,
        ...totals,
        status:         'draft',
        source_type:    'admission',
        source_number:  event.admission_number,
        customer_name:  event.patient_name || '',
        customer_id:    event.patient_id   || '',
        order_date:     event.timestamp,
        // GST
        seller_gstin:   sellerGstin,
        buyer_gstin:    '',
        place_of_supply: sellerState,
        is_inter_state: false,
        invoice_type:   'tax_invoice',
        custom_fields: {
          source_type: 'admission',
          source_number: event.admission_number,
          patient_id: event.patient_id,
        },
      }, event.createdBy, event.tenantId);

      this.logger.log(`Admission invoice created: ${event.admission_number}`);
    } catch (error) {
      this.logger.error(`Failed to create invoice for discharge ${event.admission_number}`, error);
    }
  }
}
