import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { SalesOrder, SalesOrderDocument } from './schemas/sales-order.schema';
import { AuditService } from '@audit/audit.service';
import { QueryDto } from '@common/dto/query.dto';
import { QueryBuilderService } from '@common/services/query-builder.service';
import { KafkaService } from '@kafka/kafka.service';
import { InvoicesService } from '@invoices/invoices.service';

@Injectable()
export class SalesOrdersService {
  private readonly logger = new Logger(SalesOrdersService.name);

  constructor(
    @InjectModel(SalesOrder.name)
    private salesOrderModel: Model<SalesOrderDocument>,
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
    return this.queryBuilder
      .buildQuery(this.salesOrderModel, { ...query, filter: tenantFilter })
      .exec();
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
    // IMPORTANT: Use the document's `id` field (BaseSchema), NOT the `_id` URL param,
    // because the invoice's order_id was set from `savedSalesOrder.id` during Kafka creation.
    if (updateSalesOrderDto.paid_amount !== undefined && updatedSalesOrder) {
      const so = updatedSalesOrder.toObject() as any;
      const paidAmount = so.paid_amount || 0;
      const totalAmount = so.grand_total || so.amount || 0;
      const orderId = so.id || id;
      void this.invoicesService.updatePaymentByOrderId(orderId, paidAmount, totalAmount, userId)
        .catch(err => this.logger.error(`Failed to sync invoice for SO ${orderId}`, err));
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
