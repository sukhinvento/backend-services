import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DiagnosticTest, DiagnosticTestDocument } from './schemas/diagnostic-test.schema';
import { PatientDiagnostic, PatientDiagnosticDocument } from './schemas/patient-diagnostic.schema';
import { CreateDiagnosticTestDto } from './dto/create-diagnostic-test.dto';
import { UpdateDiagnosticTestDto } from './dto/update-diagnostic-test.dto';
import { CreatePatientDiagnosticDto } from './dto/create-patient-diagnostic.dto';
import { UpdatePatientDiagnosticDto } from './dto/update-patient-diagnostic.dto';
import { AuditService } from '@audit/audit.service';

@Injectable()
export class DiagnosticsService {
  constructor(
    @InjectModel(DiagnosticTest.name) private testModel: Model<DiagnosticTestDocument>,
    @InjectModel(PatientDiagnostic.name) private bookingModel: Model<PatientDiagnosticDocument>,
    private readonly auditService: AuditService,
  ) {}

  private generateBookingNumber(): string {
    return `DIAG-${Date.now().toString(36).toUpperCase()}`;
  }

  // --- Catalog ---
  async createTest(dto: CreateDiagnosticTestDto, userId: string, tenantId: string) {
    const saved = await new this.testModel({ ...dto, tenantId, createdBy: userId, updatedBy: userId }).save();
    void this.auditService.log({ userId, action: 'create', entity: 'diagnostic_test', entityId: saved.id as string, newValue: saved.toObject(), tenantId });
    return saved;
  }

  async findAllTests(tenantId: string) {
    return this.testModel.find({ tenantId }).exec();
  }

  async updateTest(id: string, dto: UpdateDiagnosticTestDto, userId: string, tenantId: string) {
    const old = await this.testModel.findOne({ _id: id, tenantId }).exec();
    if (!old) throw new NotFoundException('Diagnostic test not found');
    const updated = await this.testModel.findByIdAndUpdate(id, { ...dto, updatedBy: userId }, { new: true }).exec();
    void this.auditService.log({ userId, action: 'update', entity: 'diagnostic_test', entityId: id, oldValue: old.toObject(), newValue: updated?.toObject(), tenantId });
    return updated;
  }

  async removeTest(id: string, userId: string, tenantId: string) {
    const removed = await this.testModel.findOneAndDelete({ _id: id, tenantId }).exec();
    if (!removed) throw new NotFoundException('Diagnostic test not found');
    void this.auditService.log({ userId, action: 'delete', entity: 'diagnostic_test', entityId: id, oldValue: removed.toObject(), tenantId });
    return { id };
  }

  // --- Bookings ---
  async createBooking(dto: CreatePatientDiagnosticDto, userId: string, tenantId: string) {
    const booking_number = this.generateBookingNumber();
    const saved = await new this.bookingModel({ ...dto, booking_number, tenantId, createdBy: userId, updatedBy: userId }).save();
    void this.auditService.log({ userId, action: 'create', entity: 'patient_diagnostic', entityId: saved.id as string, newValue: saved.toObject(), tenantId });
    return saved;
  }

  async findAllBookings(tenantId: string, status?: string, patient_id?: string, priority?: string) {
    const filter: Record<string, any> = { tenantId };
    if (status) filter.status = status;
    if (patient_id) filter.patient_id = patient_id;
    if (priority) filter.priority = priority;
    return this.bookingModel
      .find(filter)
      .sort({ ordered_date: -1 })
      .populate('patient_id', 'first_name last_name name full_name')
      .populate('test_id', 'name category')
      .populate('ordered_by_doctor_id', 'name full_name')
      .exec();
  }

  async getBookingStats(tenantId: string) {
    return this.bookingModel.aggregate([
      { $match: { tenantId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  }

  async findOneBooking(id: string, tenantId: string) {
    const booking = await this.bookingModel.findOne({ _id: id, tenantId }).exec();
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async updateBooking(id: string, dto: UpdatePatientDiagnosticDto, userId: string, tenantId: string) {
    const old = await this.bookingModel.findOne({ _id: id, tenantId }).exec();
    if (!old) throw new NotFoundException('Booking not found');
    const updated = await this.bookingModel.findByIdAndUpdate(id, { ...dto, updatedBy: userId }, { new: true }).exec();
    void this.auditService.log({ userId, action: 'update', entity: 'patient_diagnostic', entityId: id, oldValue: old.toObject(), newValue: updated?.toObject(), tenantId });
    return updated;
  }

  async getMonthlyCategoryAnalytics(tenantId: string, months = 6) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    const result = await this.bookingModel.aggregate([
      { $match: { tenantId, createdAt: { $gte: cutoff } } },
      {
        $lookup: {
          from: 'diagnostictests',
          localField: 'test_id',
          foreignField: '_id',
          as: 'test',
        },
      },
      { $unwind: { path: '$test', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            category: { $ifNull: ['$test.category', 'Other'] },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': 1, '_id.category': 1 } },
    ]);

    // Pivot: { month -> { category -> count } }
    const pivotMap: Record<string, Record<string, number>> = {};
    const allCategories = new Set<string>();
    result.forEach((r: any) => {
      const m = r._id.month;
      const cat = r._id.category;
      if (!pivotMap[m]) pivotMap[m] = {};
      pivotMap[m][cat] = r.count;
      allCategories.add(cat);
    });

    const categories = [...allCategories].sort();
    const rows = Object.entries(pivotMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, catMap]) => {
        const row: Record<string, any> = { month };
        categories.forEach(cat => { row[cat] = catMap[cat] ?? 0; });
        return row;
      });

    return { categories, rows };
  }

  async removeBooking(id: string, userId: string, tenantId: string) {
    const removed = await this.bookingModel.findOneAndDelete({ _id: id, tenantId }).exec();
    if (!removed) throw new NotFoundException('Booking not found');
    void this.auditService.log({ userId, action: 'delete', entity: 'patient_diagnostic', entityId: id, oldValue: removed.toObject(), tenantId });
    return { id };
  }
}
