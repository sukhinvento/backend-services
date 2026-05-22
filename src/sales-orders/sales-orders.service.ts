import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { SalesOrder, SalesOrderDocument } from './schemas/sales-order.schema';
import { AuditService } from '@audit/audit.service';
import { QueryDto } from '@common/dto/query.dto';
import { QueryBuilderService } from '@common/services/query-builder.service';

@Injectable()
export class SalesOrdersService {
  constructor(
    @InjectModel(SalesOrder.name)
    private salesOrderModel: Model<SalesOrderDocument>,
    private readonly auditService: AuditService,
    private readonly queryBuilder: QueryBuilderService<SalesOrderDocument>,
  ) {}

  async create(createSalesOrderDto: CreateSalesOrderDto, userId: string, tenantId: string) {
    if (!createSalesOrderDto.so_number) {
      createSalesOrderDto.so_number = `SO-${tenantId.slice(0, 6).toUpperCase()}-${Date.now()}`;
    }

    const newSalesOrder = new this.salesOrderModel({
      ...createSalesOrderDto,
      status: createSalesOrderDto.status || 'draft',
      tenantId,
      createdBy: userId,
      updatedBy: userId,
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

    return savedSalesOrder;
  }

  async findAll(query: QueryDto, tenantId: string) {
    const tenantFilter = { ...query.filter, tenantId };
    return this.queryBuilder
      .buildQuery(this.salesOrderModel, { ...query, filter: tenantFilter })
      .exec();
  }

  async findOne(id: string) {
    return this.salesOrderModel.findById(id).exec();
  }

  async update(id: string, updateSalesOrderDto: UpdateSalesOrderDto, userId: string, tenantId: string) {
    const oldSalesOrder = await this.salesOrderModel.findById(id).exec();
    const updatedSalesOrder = await this.salesOrderModel
      .findByIdAndUpdate(
        id,
        { ...updateSalesOrderDto, updatedBy: userId },
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

  async ship(id: string, userId: string) {
    return this.salesOrderModel
      .findByIdAndUpdate(id, { status: 'Shipped', updatedBy: userId }, { new: true })
      .exec();
  }

  async invoice(id: string, userId: string) {
    return this.salesOrderModel
      .findByIdAndUpdate(id, { status: 'Invoiced', updatedBy: userId }, { new: true })
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
