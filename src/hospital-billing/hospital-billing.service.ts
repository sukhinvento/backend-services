import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HospitalBill, HospitalBillDocument } from './schemas/hospital-bill.schema';
import { CreateHospitalBillDto, LineItemDto } from './dto/create-hospital-bill.dto';
import { UpdateHospitalBillDto } from './dto/update-hospital-bill.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { AuditService } from '@audit/audit.service';

@Injectable()
export class HospitalBillingService {
  constructor(
    @InjectModel(HospitalBill.name) private billModel: Model<HospitalBillDocument>,
    private readonly auditService: AuditService,
  ) {}

  private generateInvoiceNumber(): string {
    return `HINV-${Date.now().toString(36).toUpperCase()}`;
  }

  calculateTotals(lineItems: LineItemDto[]) {
    let subtotal = 0;
    let total_tax = 0;
    let total_discount = 0;

    const processedItems = lineItems.map((item) => {
      const qty = item.quantity ?? 1;
      const itemSubtotal = qty * item.unit_price;
      const discountAmount = itemSubtotal * ((item.discount_percent ?? 0) / 100);
      const afterDiscount = itemSubtotal - discountAmount;
      // Tax calculation: assume 0 tax for now (tax_ids references would need lookup)
      const tax_amount = 0;
      const total = afterDiscount + tax_amount;

      subtotal += itemSubtotal;
      total_discount += discountAmount;
      total_tax += tax_amount;

      return {
        ...item,
        quantity: qty,
        discount_percent: item.discount_percent ?? 0,
        tax_ids: item.tax_ids ?? [],
        subtotal: itemSubtotal,
        tax_amount,
        total,
      };
    });

    const grand_total = subtotal - total_discount + total_tax;

    return { processedItems, subtotal, total_tax, total_discount, grand_total };
  }

  async create(dto: CreateHospitalBillDto, userId: string, tenantId: string) {
    const invoice_number = this.generateInvoiceNumber();
    const { processedItems, subtotal, total_tax, total_discount, grand_total } = this.calculateTotals(dto.line_items);

    const saved = await new this.billModel({
      ...dto,
      invoice_number,
      line_items: processedItems,
      subtotal,
      total_tax,
      total_discount,
      grand_total,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    }).save();

    void this.auditService.log({ userId, action: 'create', entity: 'hospital_bill', entityId: saved.id as string, newValue: saved.toObject(), tenantId });
    return saved;
  }

  async findAll(tenantId: string, status?: string, patient_id?: string) {
    const filter: Record<string, any> = { tenantId };
    if (status) filter.status = status;
    if (patient_id) filter.patient_id = patient_id;
    return this.billModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async getStats(tenantId: string) {
    const [byStatus, outstandingAgg] = await Promise.all([
      this.billModel.aggregate([
        { $match: { tenantId } },
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$grand_total' } } },
      ]),
      this.billModel.aggregate([
        { $match: { tenantId, status: { $in: ['issued', 'partially_paid', 'overdue'] } } },
        { $group: { _id: null, outstanding: { $sum: { $subtract: ['$grand_total', '$paid_amount'] } } } },
      ]),
    ]);
    return { byStatus, outstanding: outstandingAgg[0]?.outstanding ?? 0 };
  }

  async findOne(id: string, tenantId: string) {
    const bill = await this.billModel.findOne({ _id: id, tenantId }).exec();
    if (!bill) throw new NotFoundException('Bill not found');
    return bill;
  }

  async update(id: string, dto: UpdateHospitalBillDto, userId: string, tenantId: string) {
    const old = await this.billModel.findOne({ _id: id, tenantId }).exec();
    if (!old) throw new NotFoundException('Bill not found');

    let updateData: any = { ...dto, updatedBy: userId };

    // Recalculate if line_items changed
    if (dto.line_items) {
      const { processedItems, subtotal, total_tax, total_discount, grand_total } = this.calculateTotals(dto.line_items);
      updateData = { ...updateData, line_items: processedItems, subtotal, total_tax, total_discount, grand_total };
    }

    const updated = await this.billModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    void this.auditService.log({ userId, action: 'update', entity: 'hospital_bill', entityId: id, oldValue: old.toObject(), newValue: updated?.toObject(), tenantId });
    return updated;
  }

  async issue(id: string, userId: string, tenantId: string) {
    const bill = await this.billModel.findOne({ _id: id, tenantId }).exec();
    if (!bill) throw new NotFoundException('Bill not found');
    const updated = await this.billModel.findByIdAndUpdate(
      id,
      { status: 'issued', issued_date: new Date(), updatedBy: userId },
      { new: true },
    ).exec();
    void this.auditService.log({ userId, action: 'update', entity: 'hospital_bill', entityId: id, oldValue: bill.toObject(), newValue: updated?.toObject(), tenantId });
    return updated;
  }

  async recordPayment(id: string, dto: RecordPaymentDto, userId: string, tenantId: string) {
    const bill = await this.billModel.findOne({ _id: id, tenantId }).exec();
    if (!bill) throw new NotFoundException('Bill not found');

    const newPaidAmount = (bill.paid_amount ?? 0) + dto.amount;
    const newStatus = newPaidAmount >= bill.grand_total
      ? 'paid'
      : newPaidAmount > 0
      ? 'partially_paid'
      : bill.status;

    const updateData: Record<string, any> = {
      paid_amount: newPaidAmount,
      status: newStatus,
      updatedBy: userId,
    };
    if (dto.payment_mode) updateData.payment_mode = dto.payment_mode;

    const updated = await this.billModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    void this.auditService.log({ userId, action: 'update', entity: 'hospital_bill', entityId: id, oldValue: bill.toObject(), newValue: updated?.toObject(), tenantId });
    return updated;
  }

  async getWeeklyAnalytics(tenantId: string, weeks = 12) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - weeks * 7);

    const result = await this.billModel.aggregate([
      { $match: { tenantId, createdAt: { $gte: cutoff } } },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: '$createdAt' },
            week: { $isoWeek: '$createdAt' },
          },
          collected: { $sum: '$paid_amount' },
          billed: { $sum: '$grand_total' },
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

  async getMonthlyAnalytics(tenantId: string, months = 12) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    const result = await this.billModel.aggregate([
      { $match: { tenantId, createdAt: { $gte: cutoff } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$grand_total' },
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

  async remove(id: string, userId: string, tenantId: string) {
    const bill = await this.billModel.findOne({ _id: id, tenantId }).exec();
    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.status !== 'draft') {
      throw new BadRequestException('Only draft bills can be deleted');
    }
    const removed = await this.billModel.findOneAndDelete({ _id: id, tenantId }).exec();
    void this.auditService.log({ userId, action: 'delete', entity: 'hospital_bill', entityId: id, oldValue: removed?.toObject(), tenantId });
    return { id };
  }
}
