import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { SalesOrder, SalesOrderDocument } from './schemas/sales-order.schema';
import { InventoryItem, InventoryItemDocument } from '../inventory/schemas/inventory-item.schema';
import { InventoryLocation, InventoryLocationDocument } from '../inventory/schemas/inventory-location.schema';
import { AuditService } from '@audit/audit.service';
import { QueryDto } from '@common/dto/query.dto';
import { QueryBuilderService } from '@common/services/query-builder.service';
import { KafkaService } from '@kafka/kafka.service';
import { InvoicesService } from '@invoices/invoices.service';

/** SO statuses that mean goods have been shipped/dispatched */
const SHIPPED_STATUSES = ['shipped', 'delivered', 'fulfilled', 'completed'];

@Injectable()
export class SalesOrdersService {
  private readonly logger = new Logger(SalesOrdersService.name);

  constructor(
    @InjectModel(SalesOrder.name)
    private salesOrderModel: Model<SalesOrderDocument>,
    @InjectModel(InventoryItem.name)
    private inventoryItemModel: Model<InventoryItemDocument>,
    @InjectModel(InventoryLocation.name)
    private inventoryLocationModel: Model<InventoryLocationDocument>,
    private readonly auditService: AuditService,
    private readonly queryBuilder: QueryBuilderService<SalesOrderDocument>,
    private readonly kafkaService: KafkaService,
    private readonly invoicesService: InvoicesService,
  ) {}

  async create(createSalesOrderDto: CreateSalesOrderDto, userId: string, tenantId: string, username?: string) {
    if (!createSalesOrderDto.so_number) {
      createSalesOrderDto.so_number = `SO-${tenantId.slice(0, 6).toUpperCase()}-${Date.now()}`;
    }

    const newSalesOrder = new this.salesOrderModel({
      ...createSalesOrderDto,
      status: createSalesOrderDto.status || 'draft',
      tenantId,
      createdBy: username || userId,
      updatedBy: username || userId,
    });
    const savedSalesOrder = await newSalesOrder.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'sales_order',
      entityId: savedSalesOrder.id as string,
      newValue: savedSalesOrder.toObject(),
      tenantId,
    });

    // Emit event for automatic invoice creation (include full source details)
    const soObj = savedSalesOrder.toObject() as any;
    void this.kafkaService.sendEvent('billing-events', `so-${savedSalesOrder.id}`, {
      eventType: 'sales_order.created',
      entity_id: savedSalesOrder.id as string,
      entity_type: 'sales_order',
      amount: soObj.grand_total || 0,
      items: soObj.items || [],
      customer_id: createSalesOrderDto.customer_id,
      customer_name: createSalesOrderDto.customer_name,
      customer_phone: createSalesOrderDto.customer_phone,
      customer_email: createSalesOrderDto.customer_email,
      customer_address: createSalesOrderDto.customer_address,
      so_number: createSalesOrderDto.so_number,
      order_date: soObj.order_date,
      delivery_date: soObj.delivery_date,
      payment_method: soObj.payment_method,
      shipping_address: soObj.shipping_address,
      notes: soObj.notes,
      tenantId,
      createdBy: userId,
      timestamp: new Date().toISOString(),
    }).catch(err => this.logger.error('Failed to emit SO creation event', err));

    return savedSalesOrder;
  }

  async findAll(query: QueryDto, tenantId: string) {
    const tenantFilter = { ...query.filter, tenantId };
    return await this.queryBuilder.buildQuery(this.salesOrderModel, { ...query, filter: tenantFilter });
  }

  async findOne(id: string) {
    return this.salesOrderModel.findById(id).exec();
  }

  async update(id: string, updateSalesOrderDto: UpdateSalesOrderDto, userId: string, tenantId: string, username?: string) {
    const oldSalesOrder = await this.salesOrderModel.findById(id).exec();
    const updatedSalesOrder = await this.salesOrderModel
      .findByIdAndUpdate(
        id,
        { ...updateSalesOrderDto, updatedBy: username || userId },
        { new: true },
      )
      .exec();

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'sales_order',
      entityId: id,
      oldValue: oldSalesOrder?.toObject(),
      newValue: updatedSalesOrder?.toObject(),
      tenantId,
    });

    // Sync invoice status when paid_amount changes
    if (updateSalesOrderDto.paid_amount !== undefined && updatedSalesOrder) {
      const so = updatedSalesOrder.toObject() as any;
      const paidAmount = so.paid_amount || 0;
      const totalAmount = so.grand_total || so.amount || 0;
      const orderId = so.id || id;
      void this.invoicesService.updatePaymentByOrderId(orderId, paidAmount, totalAmount, userId)
        .catch(err => this.logger.error(`Failed to sync invoice for SO ${orderId}`, err));
    }

    // ── When SO status → Shipped/Delivered: reduce inventory stock ──
    const oldStatus = String((oldSalesOrder as any)?.status || '').toLowerCase();
    const newStatus = String(updateSalesOrderDto.status || '').toLowerCase();
    const isNewShipped = SHIPPED_STATUSES.includes(newStatus) && !SHIPPED_STATUSES.includes(oldStatus);

    if (isNewShipped && updatedSalesOrder) {
      const soObj = updatedSalesOrder.toObject() as any;
      const soItems: any[] = soObj.items || [];
      const sourceLocation = soObj.shipping_address || soObj.source_location || '';

      for (const item of soItems) {
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
              { $inc: { current_stock: -qty } },
            ).exec();
            inventoryDoc = await this.inventoryItemModel.findOne({ _id: itemId, tenantId }).exec();
            this.logger.log(`SO ${id} shipped: -${qty} from inventory item ${itemId}`);
          } else if (itemName || itemSku) {
            const filter: any = { tenantId };
            if (itemSku) filter.sku = itemSku;
            else filter.name = { $regex: `^${itemName}`, $options: 'i' };
            const result = await this.inventoryItemModel.updateOne(
              filter,
              { $inc: { current_stock: -qty } },
            ).exec();
            if (result.modifiedCount > 0) {
              inventoryDoc = await this.inventoryItemModel.findOne(filter).exec();
              this.logger.log(`SO ${id} shipped: -${qty} from inventory "${itemSku || itemName}"`);
            } else {
              this.logger.warn(`SO ${id}: no inventory item found for "${itemSku || itemName}"`);
            }
          }

          // ── Also reduce location-wise stock if location tracking exists ──
          if (inventoryDoc && sourceLocation) {
            await this.inventoryLocationModel.updateOne(
              { inventory_item_id: inventoryDoc._id, location_name: sourceLocation, tenantId },
              { $inc: { quantity: -qty } },
            ).exec();
          }
        } catch (err) {
          this.logger.error(`SO ${id}: failed to reduce stock for item "${itemName}"`, err);
        }
      }

      // ── Update linked invoice status from 'draft' → 'pending' ──
      const soOrderId = soObj.id || id;
      void this.invoicesService.updateStatusByOrderId(soOrderId, 'pending', userId)
        .catch(err => this.logger.error(`Failed to update invoice status for SO ${soOrderId}`, err));
    }

    // ── When SO status → confirmed: also update invoice to 'pending' ──
    if (newStatus === 'confirmed' && oldStatus !== 'confirmed' && updatedSalesOrder) {
      const soObj = updatedSalesOrder.toObject() as any;
      const soOrderId = soObj.id || id;
      void this.invoicesService.updateStatusByOrderId(soOrderId, 'pending', userId)
        .catch(err => this.logger.error(`Failed to update invoice status for SO ${soOrderId}`, err));
    }

    return updatedSalesOrder;
  }

  async remove(id: string, userId: string, tenantId: string) {
    const removedSalesOrder = await this.salesOrderModel.findByIdAndDelete(id).exec();

    void this.auditService.log({
      userId,
      action: 'delete',
      entity: 'sales_order',
      entityId: id,
      oldValue: removedSalesOrder?.toObject(),
      tenantId,
    });

    return { id };
  }

  async ship(id: string, userId: string, username?: string) {
    return this.salesOrderModel
      .findByIdAndUpdate(id, { status: 'Shipped', updatedBy: username || userId }, { new: true })
      .exec();
  }

  async invoice(id: string, userId: string, username?: string) {
    return this.salesOrderModel
      .findByIdAndUpdate(id, { status: 'Invoiced', updatedBy: username || userId }, { new: true })
      .exec();
  }

  async getMonthlyAnalytics(tenantId: string, months = 12) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const result = await this.salesOrderModel.aggregate([
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

  async getStats(tenantId: string) {
    const orders = await this.salesOrderModel.find({ tenantId }).exec();

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((s, o) => s + (o.grand_total || 0), 0);
    const processingOrders = orders.filter(o =>
      ['draft', 'processing', 'Processing'].includes(o.status),
    ).length;
    const deliveredOrders = orders.filter(o =>
      ['Delivered', 'delivered', 'invoiced', 'Invoiced'].includes(o.status),
    ).length;
    const pendingPayments = orders
      .filter(o => ['Pending', 'pending'].includes(o.payment_status || ''))
      .reduce((s, o) => s + (o.grand_total || 0), 0);

    return {
      totalOrders,
      totalRevenue,
      processingOrders,
      deliveredOrders,
      pendingPayments,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    };
  }
}
