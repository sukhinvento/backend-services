import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Invoice, InvoiceDocument } from './schemas/invoice.schema';
import { TenantsService } from '@tenants/tenants.service';
import { AuditService } from '@audit/audit.service';
import { QueryDto } from '@common/dto/query.dto';
import { QueryBuilderService } from '@common/services/query-builder.service';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    private readonly tenantsService: TenantsService,
    private readonly auditService: AuditService,
    private readonly queryBuilder: QueryBuilderService<InvoiceDocument>,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto, userId: string, tenantId: string, username?: string) {
    const fieldConfigs = await this.tenantsService.getFieldConfiguration(
      tenantId,
      'invoice',
    );

    // Custom fields validation (skip if not present)
    if (createInvoiceDto.custom_fields) {
      for (const fieldConfig of fieldConfigs) {
        if (
          fieldConfig.required &&
          !createInvoiceDto.custom_fields[fieldConfig.field_id]
        ) {
          throw new BadRequestException(`${fieldConfig.label} is required.`);
        }
      }
    }

    // Auto-generate invoice_number if not provided
    const invoice_number = createInvoiceDto.invoice_number || `INV-${Date.now().toString(36).toUpperCase()}`;

    const newInvoice = new this.invoiceModel({
      ...createInvoiceDto,
      invoice_number,
      status: createInvoiceDto.status || 'draft',
      tenantId,
      createdBy: username || userId,
      updatedBy: username || userId,
    });
    const savedInvoice = await newInvoice.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'invoice',
      entityId: savedInvoice.id as string,

      newValue: savedInvoice.toObject(),
      tenantId,
    });

    return savedInvoice;
  }

  async findAll(query: QueryDto) {
    return await this.queryBuilder.buildQuery(this.invoiceModel, query);
  }

  async findOne(id: string) {
    return this.invoiceModel.findById(id).exec();
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto, userId: string, username?: string) {
    const oldInvoice = await this.invoiceModel.findById(id).exec();
    const updatedInvoice = await this.invoiceModel
      .findByIdAndUpdate(
        id,
        { ...updateInvoiceDto, updatedBy: username || userId },
        { new: true },
      )
      .exec();

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'invoice',
      entityId: id,

      oldValue: oldInvoice?.toObject(),

      newValue: updatedInvoice?.toObject(),
      tenantId: 'pharma_inc', // TODO: Get from context
    });

    return updatedInvoice;
  }

  async remove(id: string, userId: string) {
    const removedInvoice = await this.invoiceModel.findByIdAndDelete(id).exec();

    void this.auditService.log({
      userId,
      action: 'delete',
      entity: 'invoice',
      entityId: id,

      oldValue: removedInvoice?.toObject(),
      tenantId: 'pharma_inc', // TODO: Get from context
    });

    return { id };
  }

  async pay(id: string, userId: string, username?: string) {
    const oldInvoice = await this.invoiceModel.findById(id).exec();
    const updatedInvoice = await this.invoiceModel
      .findByIdAndUpdate(
        id,
        { status: 'paid', paid_amount: oldInvoice?.amount || 0, updatedBy: username || userId },
        { new: true },
      )
      .exec();

    void this.auditService.log({
      userId,
      action: 'pay',
      entity: 'invoice',
      entityId: id,
      oldValue: oldInvoice?.toObject(),
      newValue: updatedInvoice?.toObject(),
      tenantId: oldInvoice?.tenantId || 'pharma_inc',
    });

    return updatedInvoice;
  }

  /**
   * Update the linked invoice when a PO/SO payment is recorded.
   * Finds invoice by order_id and updates paid_amount + status.
   */
  // ── Revenue source types (money IN to hospital) ────────────────────────────
  private readonly REVENUE_SOURCES = ['sales_order', 'diagnostic_booking', 'admission'];
  // ── Expenditure source types (money OUT from hospital) ─────────────────────
  private readonly EXPENDITURE_SOURCES = ['purchase_order'];

  /** Weekly revenue collection — SO + diagnostics + admissions only */
  async getWeeklyAnalytics(tenantId: string, weeks = 12) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - weeks * 7);

    const result = await this.invoiceModel.aggregate([
      {
        $match: {
          tenantId,
          createdAt: { $gte: cutoff },
          source_type: { $in: this.REVENUE_SOURCES },
        },
      },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: '$createdAt' },
            week: { $isoWeek: '$createdAt' },
          },
          collected: { $sum: '$paid_amount' },
          billed: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]);

    return result.map((r: any) => ({
      week: `W${r._id.week}`,
      collected: Math.round(r.collected / 1000),
      outstanding: Math.round(Math.max(0, r.billed - r.collected) / 1000),
      billed: Math.round(r.billed / 1000),
      count: r.count,
    }));
  }

  /** Monthly revenue — SO + diagnostics + admissions only */
  async getMonthlyAnalytics(tenantId: string, months = 12) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    const result = await this.invoiceModel.aggregate([
      {
        $match: {
          tenantId,
          createdAt: { $gte: cutoff },
          source_type: { $in: this.REVENUE_SOURCES },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          collected: { $sum: '$paid_amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return result.map((r: any) => ({
      month: r._id,
      revenue: Math.round(r.revenue / 1000),
      collected: Math.round(r.collected / 1000),
      count: r.count,
    }));
  }

  /** Monthly expenditure — purchase orders only (money OUT to vendors) */
  async getMonthlyExpenditureAnalytics(tenantId: string, months = 12) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    const result = await this.invoiceModel.aggregate([
      {
        $match: {
          tenantId,
          createdAt: { $gte: cutoff },
          source_type: { $in: this.EXPENDITURE_SOURCES },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          spend: { $sum: '$amount' },
          paid: { $sum: '$paid_amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return result.map((r: any) => ({
      month: r._id,
      spend: Math.round(r.spend / 1000),
      paid: Math.round(r.paid / 1000),
      count: r.count,
    }));
  }

  /**
   * Transition invoice status when the linked PO/SO changes status.
   * Only transitions forward (draft → pending, never backwards).
   */
  async updateStatusByOrderId(
    orderId: string,
    newStatus: string,
    userId: string,
  ) {
    const invoice = await this.invoiceModel.findOne({ order_id: orderId }).exec();
    if (!invoice) return null;

    // Only transition forward: draft → pending/sent. Never overwrite paid/partially_paid.
    const currentStatus = String(invoice.status || 'draft').toLowerCase();
    const noOverwrite = ['paid', 'partially_paid', 'cancelled', 'void'];
    if (noOverwrite.includes(currentStatus)) {
      return invoice; // don't regress status
    }

    const oldInvoice = invoice.toObject();
    const updatedInvoice = await this.invoiceModel
      .findByIdAndUpdate(
        invoice._id,
        { status: newStatus, updatedBy: userId },
        { new: true },
      )
      .exec();

    void this.auditService.log({
      userId,
      action: 'status_update',
      entity: 'invoice',
      entityId: invoice._id as string,
      oldValue: oldInvoice,
      newValue: updatedInvoice?.toObject(),
      tenantId: invoice.tenantId,
    });

    return updatedInvoice;
  }

  async updatePaymentByOrderId(
    orderId: string,
    paidAmount: number,
    totalAmount: number,
    userId: string,
  ) {
    const invoice = await this.invoiceModel.findOne({ order_id: orderId }).exec();
    if (!invoice) return null;

    const currentStatus = String(invoice.status || 'draft').toLowerCase();
    let status = currentStatus;
    if (paidAmount >= totalAmount && totalAmount > 0) {
      status = 'paid';
    } else if (paidAmount > 0) {
      status = 'partially_paid';
    } else if (currentStatus === 'draft') {
      status = 'pending'; // move from draft to pending when order updates payment
    }

    const oldInvoice = invoice.toObject();
    const updatedInvoice = await this.invoiceModel
      .findByIdAndUpdate(
        invoice._id,
        {
          paid_amount: paidAmount,
          amount: totalAmount,
          status,
          updatedBy: userId,
        },
        { new: true },
      )
      .exec();

    void this.auditService.log({
      userId,
      action: 'payment_update',
      entity: 'invoice',
      entityId: invoice._id as string,
      oldValue: oldInvoice,
      newValue: updatedInvoice?.toObject(),
      tenantId: invoice.tenantId,
    });

    return updatedInvoice;
  }
}
