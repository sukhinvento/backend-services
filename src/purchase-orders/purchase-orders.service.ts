import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import {
  PurchaseOrder,
  PurchaseOrderDocument,
} from './schemas/purchase-order.schema';
import { InventoryItem, InventoryItemDocument } from '../inventory/schemas/inventory-item.schema';
import { InventoryLocation, InventoryLocationDocument } from '../inventory/schemas/inventory-location.schema';
import { InventoryBatch, InventoryBatchDocument } from '../inventory/schemas/inventory-batch.schema';
import { TenantsService } from '@tenants/tenants.service';
import { AuditService } from '@audit/audit.service';
import { QueryDto } from '@common/dto/query.dto';
import { QueryBuilderService } from '@common/services/query-builder.service';
import { KafkaService } from '@kafka/kafka.service';
import { InvoicesService } from '@invoices/invoices.service';
import { NotificationEventService } from '../notifications/notification-event.service';

/** Status values that mean "goods received" — case-insensitive match */
const RECEIVED_STATUSES = ['received', 'delivered', 'fulfilled'];

@Injectable()
export class PurchaseOrdersService {
  private readonly logger = new Logger(PurchaseOrdersService.name);

  constructor(
    @InjectModel(PurchaseOrder.name)
    private purchaseOrderModel: Model<PurchaseOrderDocument>,
    @InjectModel(InventoryItem.name)
    private inventoryItemModel: Model<InventoryItemDocument>,
    @InjectModel(InventoryLocation.name)
    private inventoryLocationModel: Model<InventoryLocationDocument>,
    @InjectModel(InventoryBatch.name)
    private inventoryBatchModel: Model<InventoryBatchDocument>,
    private readonly tenantsService: TenantsService,
    private readonly auditService: AuditService,
    private readonly queryBuilder: QueryBuilderService<PurchaseOrderDocument>,
    private readonly kafkaService: KafkaService,
    private readonly invoicesService: InvoicesService,
    private readonly notifEvent: NotificationEventService,
  ) {}

  async create(
    createPurchaseOrderDto: CreatePurchaseOrderDto,
    userId: string,
    tenantId: string,
    username?: string,
  ) {
    const fieldConfigs = await this.tenantsService.getFieldConfiguration(
      tenantId,
      'purchase_order',
    );

    for (const fieldConfig of fieldConfigs) {
      if (
        fieldConfig.required &&
        !createPurchaseOrderDto.custom_fields?.[fieldConfig.field_id]
      ) {
        throw new BadRequestException(`${fieldConfig.label} is required.`);
      }
    }

    const po_number =
      createPurchaseOrderDto.po_number ||
      `PO-${tenantId.slice(0, 6).toUpperCase()}-${Date.now()}`;

    const newPurchaseOrder = new this.purchaseOrderModel({
      ...createPurchaseOrderDto,
      po_number,
      tenantId,
      status: 'draft',
      createdBy: username || userId,
      updatedBy: username || userId,
    });
    const savedPurchaseOrder = await newPurchaseOrder.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'purchase_order',
      entityId: savedPurchaseOrder.id as string,
      newValue: savedPurchaseOrder.toObject(),
      tenantId,
    });

    // Emit event for automatic invoice creation (include full source details)
    const poObj = savedPurchaseOrder.toObject() as any;
    void this.kafkaService.sendEvent('billing-events', `po-${savedPurchaseOrder.id}`, {
      eventType: 'purchase_order.created',
      entity_id: savedPurchaseOrder.id as string,
      entity_type: 'purchase_order',
      amount: poObj.grand_total || 0,
      items: poObj.items || [],
      vendor_id: createPurchaseOrderDto.vendor_id,
      vendor_name: createPurchaseOrderDto.vendor_name,
      vendor_phone: createPurchaseOrderDto.vendor_phone,
      vendor_email: createPurchaseOrderDto.vendor_email,
      vendor_address: createPurchaseOrderDto.vendor_address,
      po_number: po_number,
      order_date: poObj.order_date,
      delivery_date: poObj.delivery_date,
      payment_method: poObj.payment_method,
      shipping_address: poObj.shipping_address,
      notes: poObj.notes,
      tenantId,
      createdBy: userId,
      timestamp: new Date().toISOString(),
    }).catch(err => this.logger.error('Failed to emit PO creation event', err));

    // Emit notification event — routes to users with purchase-order scope
    this.notifEvent.emit({
      eventType: 'purchase_order.created',
      entity_id: savedPurchaseOrder.id as string,
      entity_type: 'purchase_order',
      tenantId,
      createdBy: userId,
      timestamp: new Date().toISOString(),
      title: 'New Purchase Order',
      message: `${po_number} created for ${createPurchaseOrderDto.vendor_name || 'vendor'} worth ₹${poObj.grand_total?.toLocaleString('en-IN') || '0'}`,
      severity: 'info',
      actionUrl: '/purchase-orders',
      metadata: { po_number, vendor: createPurchaseOrderDto.vendor_name, amount: poObj.grand_total },
    });

    return savedPurchaseOrder;
  }

  async getStats(tenantId: string) {
    const orders = await this.purchaseOrderModel.find({ tenantId }).lean().exec();
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => ['draft', 'pending'].includes(String(o.status))).length;
    const approvedOrders = orders.filter(o => o.status === 'approved').length;
    const deliveredOrders = orders.filter(o => o.status === 'fulfilled').length;
    const totalValue = orders.reduce((sum, o: any) => sum + (o.grand_total || o.total || 0), 0);
    const pendingValue = orders
      .filter(o => ['draft', 'pending'].includes(String(o.status)))
      .reduce((sum, o: any) => sum + (o.grand_total || o.total || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;
    return { totalOrders, pendingOrders, approvedOrders, deliveredOrders, totalValue, pendingValue, averageOrderValue };
  }

  async findAll(query: QueryDto, tenantId: string) {
    const filter = { ...(query.filter || {}), tenantId };
    return await this.queryBuilder.buildQuery(this.purchaseOrderModel, { ...query, filter });
  }

  async findOne(id: string, tenantId: string) {
    return this.purchaseOrderModel.findOne({ _id: id, tenantId }).exec();
  }

  async update(
    id: string,
    updatePurchaseOrderDto: UpdatePurchaseOrderDto,
    userId: string,
    tenantId: string,
    username?: string,
  ) {
    const oldPurchaseOrder = await this.purchaseOrderModel
      .findOne({ _id: id, tenantId })
      .exec();
    const updatedPurchaseOrder = await this.purchaseOrderModel
      .findOneAndUpdate(
        { _id: id, tenantId },
        { ...updatePurchaseOrderDto, updatedBy: username || userId },
        { new: true },
      )
      .exec();

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'purchase_order',
      entityId: id,
      oldValue: oldPurchaseOrder?.toObject(),
      newValue: updatedPurchaseOrder?.toObject(),
      tenantId,
    });

    // Sync invoice status when paid_amount changes
    // IMPORTANT: Use the document's `id` field (BaseSchema), NOT the `_id` URL param,
    // because the invoice's order_id was set from `savedPurchaseOrder.id` during Kafka creation.
    if (updatePurchaseOrderDto.paid_amount !== undefined && updatedPurchaseOrder) {
      const po = updatedPurchaseOrder.toObject() as any;
      const paidAmount = po.paid_amount || 0;
      const totalAmount = po.grand_total || po.amount || 0;
      const orderId = po.id || id;
      void this.invoicesService.updatePaymentByOrderId(orderId, paidAmount, totalAmount, userId)
        .catch(err => this.logger.error(`Failed to sync invoice for PO ${orderId}`, err));
    }

    // ── When PO status → Received/Delivered: add item quantities to inventory ──
    const oldStatus = String((oldPurchaseOrder as any)?.status || '').toLowerCase();
    const newStatus = String(updatePurchaseOrderDto.status || '').toLowerCase();
    const isNewReceived = RECEIVED_STATUSES.includes(newStatus) && !RECEIVED_STATUSES.includes(oldStatus);

    if (isNewReceived && updatedPurchaseOrder) {
      const poObj = updatedPurchaseOrder.toObject() as any;
      const poItems: any[] = poObj.items || [];
      // Determine delivery location from PO — use shipping_address or a location_id on the PO
      const deliveryLocationName = poObj.shipping_address || poObj.delivery_location || 'Main Warehouse';
      const deliveryLocationId = poObj.delivery_location_id || poObj.location_id || null;

      for (const item of poItems) {
        const qty = item.quantity ?? item.qty ?? 0;
        const itemId = item.item_id || item.inventory_id;
        const itemName = item.name || '';
        const itemSku = item.sku || '';
        if (qty <= 0) continue;

        try {
          let inventoryDoc: any = null;

          if (itemId) {
            await this.inventoryItemModel.updateOne(
              { _id: itemId, tenantId },
              { $inc: { current_stock: qty } },
            ).exec();
            inventoryDoc = await this.inventoryItemModel.findOne({ _id: itemId, tenantId }).exec();
            this.logger.log(`PO ${id} received: +${qty} to inventory item ${itemId}`);
          } else if (itemName || itemSku) {
            const filter: any = { tenantId };
            if (itemSku) filter.sku = itemSku;
            else filter.name = itemName;
            const result = await this.inventoryItemModel.updateOne(
              filter,
              { $inc: { current_stock: qty } },
            ).exec();
            if (result.modifiedCount > 0) {
              inventoryDoc = await this.inventoryItemModel.findOne(filter).exec();
              this.logger.log(`PO ${id} received: +${qty} to inventory "${itemSku || itemName}"`);
            } else {
              this.logger.warn(`PO ${id}: no inventory item found for "${itemSku || itemName}"`);
            }
          }

          // ── Update location-wise stock allocation ──
          if (inventoryDoc) {
            // Find existing location record for this item+location combo
            const locFilter: any = {
              inventory_item_id: inventoryDoc._id,
              location_name: deliveryLocationName,
              tenantId,
            };

            const existingLoc = await this.inventoryLocationModel.findOne(locFilter).exec();
            if (existingLoc) {
              await this.inventoryLocationModel.updateOne(
                { _id: existingLoc._id },
                { $inc: { quantity: qty } },
              ).exec();
            } else {
              // Use the real location_id if available; otherwise use a stable
              // hash of the location name so repeated deliveries to the same
              // location name are grouped together correctly.
              const stableLocId = deliveryLocationId
                || `loc-${deliveryLocationName.toLowerCase().replace(/\s+/g, '-')}-${tenantId}`;

              await new this.inventoryLocationModel({
                inventory_item_id: inventoryDoc._id,
                location_id: stableLocId,
                location_name: deliveryLocationName,
                quantity: qty,
                tenantId,
              }).save();
            }
            this.logger.log(`PO ${id}: location "${deliveryLocationName}" +${qty} for "${itemSku || itemName}"`);
          }

          // ── Create batch record if batch_number is provided on the PO item ──
          const batchNumber = item.batch_number || item.batchNumber;
          if (batchNumber && inventoryDoc) {
            const batchFilter = {
              inventory_item_id: inventoryDoc._id,
              batch_number: batchNumber,
              tenantId,
            };
            const existingBatch = await this.inventoryBatchModel.findOne(batchFilter).exec();
            if (existingBatch) {
              existingBatch.quantity += qty;
              existingBatch.updatedBy = username || userId;
              await existingBatch.save();
            } else {
              await new this.inventoryBatchModel({
                inventory_item_id: inventoryDoc._id,
                batch_number: batchNumber,
                expiry_date: item.expiry_date || item.expiryDate || '',
                quantity: qty,
                used_quantity: 0,
                received_date: new Date().toISOString().split('T')[0],
                po_number: poObj.po_number,
                po_id: poObj.id || id,
                manufacturer: item.manufacturer || '',
                location_name: deliveryLocationName,
                unit_cost: item.unit_price || item.unit_cost || 0,
                status: 'active',
                tenantId,
                createdBy: username || userId,
                updatedBy: username || userId,
              }).save();
            }
            this.logger.log(`PO ${id}: batch "${batchNumber}" created for "${itemSku || itemName}"`);
          }
        } catch (err) {
          this.logger.error(`PO ${id}: failed to update stock for item "${itemName}"`, err);
        }
      }

      // ── Update linked invoice status from 'draft' → 'pending' ──
      const poOrderId = poObj.id || id;
      void this.invoicesService.updateStatusByOrderId(poOrderId, 'pending', userId)
        .catch(err => this.logger.error(`Failed to update invoice status for PO ${poOrderId}`, err));
    }

    return updatedPurchaseOrder;
  }

  async remove(id: string, userId: string, tenantId: string) {
    const removedPurchaseOrder = await this.purchaseOrderModel
      .findOneAndDelete({ _id: id, tenantId })
      .exec();

    void this.auditService.log({
      userId,
      action: 'delete',
      entity: 'purchase_order',
      entityId: id,
      oldValue: removedPurchaseOrder?.toObject(),
      tenantId,
    });

    return { id };
  }

  async getMonthlyAnalytics(tenantId: string, months = 12) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const result = await this.purchaseOrderModel.aggregate([
      { $match: { tenantId, createdAt: { $gte: cutoff } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: '$grand_total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return result.map((r: any) => ({ month: r._id, total: r.total, count: r.count }));
  }

  /**
   * Create a draft PO from low/critical stock items.
   * The user can edit the draft before confirming.
   *
   * @param items - Array of { inventory_item_id, name, sku, quantity, unit_price, batch_number?, expiry_date? }
   * @param vendorId - Optional vendor to assign
   * @param vendorName - Optional vendor name
   * @param shippingAddress - Delivery location
   */
  async createReorderPO(
    reorderData: {
      items: Array<{
        inventory_item_id?: string;
        name: string;
        sku?: string;
        quantity: number;
        unit_price?: number;
        batch_number?: string;
        expiry_date?: string;
      }>;
      vendor_id?: string;
      vendor_name?: string;
      shipping_address?: string;
      notes?: string;
    },
    userId: string,
    tenantId: string,
    username?: string,
  ) {
    const items = reorderData.items.map(item => ({
      item_id: item.inventory_item_id || '',
      name: item.name,
      sku: item.sku || '',
      quantity: item.quantity,
      unit_price: item.unit_price || 0,
      subtotal: item.quantity * (item.unit_price || 0),
      batch_number: item.batch_number || '',
      expiry_date: item.expiry_date || '',
    }));

    const grand_total = items.reduce((sum, i) => sum + i.subtotal, 0);

    return this.create(
      {
        vendor_id: reorderData.vendor_id,
        vendor_name: reorderData.vendor_name,
        shipping_address: reorderData.shipping_address || '',
        items: items as any,
        grand_total,
        notes: reorderData.notes || 'Auto-generated reorder PO for low-stock items',
        status: 'draft',
        order_date: new Date().toISOString().split('T')[0],
      },
      userId,
      tenantId,
      username,
    );
  }

  async approve(id: string, userId: string, tenantId: string, username?: string) {
    const oldPurchaseOrder = await this.purchaseOrderModel
      .findOne({ _id: id, tenantId })
      .exec();
    const updatedPurchaseOrder = await this.purchaseOrderModel
      .findOneAndUpdate(
        { _id: id, tenantId },
        { status: 'approved', updatedBy: username || userId },
        { new: true },
      )
      .exec();

    void this.auditService.log({
      userId,
      action: 'approve',
      entity: 'purchase_order',
      entityId: id,
      oldValue: oldPurchaseOrder?.toObject(),
      newValue: updatedPurchaseOrder?.toObject(),
      tenantId,
    });

    // Notify requester and PO scope users that the order was approved
    if (updatedPurchaseOrder) {
      const po = updatedPurchaseOrder.toObject() as any;
      this.notifEvent.emit({
        eventType: 'purchase_order.approved',
        entity_id: id,
        entity_type: 'purchase_order',
        tenantId,
        createdBy: userId,
        timestamp: new Date().toISOString(),
        title: 'Purchase Order Approved',
        message: `${po.po_number} has been approved by ${username || userId}`,
        severity: 'success',
        actionUrl: '/purchase-orders',
        metadata: { po_number: po.po_number, approvedBy: username || userId },
      });
    }

    return updatedPurchaseOrder;
  }
}
