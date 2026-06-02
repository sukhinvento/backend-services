import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import {
  PurchaseOrder,
  PurchaseOrderDocument,
} from './schemas/purchase-order.schema';
import { TenantsService } from '@tenants/tenants.service';
import { AuditService } from '@audit/audit.service';
import { QueryDto } from '@common/dto/query.dto';
import { QueryBuilderService } from '@common/services/query-builder.service';
import { KafkaService } from '@kafka/kafka.service';
import { InvoicesService } from '@invoices/invoices.service';

@Injectable()
export class PurchaseOrdersService {
  private readonly logger = new Logger(PurchaseOrdersService.name);

  constructor(
    @InjectModel(PurchaseOrder.name)
    private purchaseOrderModel: Model<PurchaseOrderDocument>,
    private readonly tenantsService: TenantsService,
    private readonly auditService: AuditService,
    private readonly queryBuilder: QueryBuilderService<PurchaseOrderDocument>,
    private readonly kafkaService: KafkaService,
    private readonly invoicesService: InvoicesService,
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
    return this.queryBuilder
      .buildQuery(this.purchaseOrderModel, { ...query, filter })
      .exec();
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

    return updatedPurchaseOrder;
  }
}
