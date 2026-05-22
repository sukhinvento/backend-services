import { Injectable, BadRequestException } from '@nestjs/common';
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

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectModel(PurchaseOrder.name)
    private purchaseOrderModel: Model<PurchaseOrderDocument>,
    private readonly tenantsService: TenantsService,
    private readonly auditService: AuditService,
    private readonly queryBuilder: QueryBuilderService<PurchaseOrderDocument>,
  ) {}

  async create(
    createPurchaseOrderDto: CreatePurchaseOrderDto,
    userId: string,
    tenantId: string,
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
      createdBy: userId,
      updatedBy: userId,
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
  ) {
    const oldPurchaseOrder = await this.purchaseOrderModel
      .findOne({ _id: id, tenantId })
      .exec();
    const updatedPurchaseOrder = await this.purchaseOrderModel
      .findOneAndUpdate(
        { _id: id, tenantId },
        { ...updatePurchaseOrderDto, updatedBy: userId },
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

  async approve(id: string, userId: string, tenantId: string) {
    const oldPurchaseOrder = await this.purchaseOrderModel
      .findOne({ _id: id, tenantId })
      .exec();
    const updatedPurchaseOrder = await this.purchaseOrderModel
      .findOneAndUpdate(
        { _id: id, tenantId },
        { status: 'approved', updatedBy: userId },
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
