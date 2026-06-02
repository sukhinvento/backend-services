import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DiagnosticTest, DiagnosticTestDocument } from './schemas/diagnostic-test.schema';
import { PatientDiagnostic, PatientDiagnosticDocument } from './schemas/patient-diagnostic.schema';
import { Patient, PatientDocument } from '@patients/schemas/patient.schema';
import { Doctor, DoctorDocument } from '@doctors/schemas/doctor.schema';
import { CreateDiagnosticTestDto } from './dto/create-diagnostic-test.dto';
import { UpdateDiagnosticTestDto } from './dto/update-diagnostic-test.dto';
import { CreatePatientDiagnosticDto } from './dto/create-patient-diagnostic.dto';
import { UpdatePatientDiagnosticDto } from './dto/update-patient-diagnostic.dto';
import { AuditService } from '@audit/audit.service';
import { KafkaService } from '@kafka/kafka.service';

@Injectable()
export class DiagnosticsService {
  private readonly logger = new Logger(DiagnosticsService.name);

  constructor(
    @InjectModel(DiagnosticTest.name) private testModel: Model<DiagnosticTestDocument>,
    @InjectModel(PatientDiagnostic.name) private bookingModel: Model<PatientDiagnosticDocument>,
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    @InjectModel(Doctor.name) private doctorModel: Model<DoctorDocument>,
    private readonly auditService: AuditService,
    private readonly kafkaService: KafkaService,
  ) {}

  private generateBookingNumber(): string {
    return `DIAG-${Date.now().toString(36).toUpperCase()}`;
  }

  // Resolve patient ID (string like PAT-0001) to MongoDB ObjectId
  private async resolvePatientId(patientIdStr: string, tenantId: string): Promise<Types.ObjectId> {
    // Check if it's already a valid ObjectId
    if (Types.ObjectId.isValid(patientIdStr)) {
      const patient = await this.patientModel.findOne({ _id: patientIdStr, tenantId }).exec();
      if (patient) return new Types.ObjectId(patientIdStr);
    }
    
    // Try to find by patient_id (e.g., PAT-0001)
    const patient = await this.patientModel.findOne({ patient_id: patientIdStr, tenantId }).exec();
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientIdStr} not found`);
    }
    return patient._id as Types.ObjectId;
  }

  // Resolve test ID to MongoDB ObjectId
  private async resolveTestId(testIdStr: string, tenantId: string): Promise<Types.ObjectId> {
    // Check if it's already a valid ObjectId
    if (Types.ObjectId.isValid(testIdStr)) {
      const test = await this.testModel.findOne({ _id: testIdStr, tenantId }).exec();
      if (test) return new Types.ObjectId(testIdStr);
    }
    
    // Try to find by test_code
    const test = await this.testModel.findOne({ test_code: testIdStr, tenantId }).exec();
    if (!test) {
      throw new NotFoundException(`Diagnostic test with ID ${testIdStr} not found`);
    }
    return test._id as Types.ObjectId;
  }

  // Resolve doctor ID to MongoDB ObjectId
  private async resolveDoctorId(doctorIdStr: string | undefined, tenantId: string): Promise<Types.ObjectId | undefined> {
    if (!doctorIdStr) return undefined;
    
    // Check if it's already a valid ObjectId
    if (Types.ObjectId.isValid(doctorIdStr)) {
      const doctor = await this.doctorModel.findOne({ _id: doctorIdStr, tenantId }).exec();
      if (doctor) return new Types.ObjectId(doctorIdStr);
    }
    
    // Try to find by employee_id or name
    const doctor = await this.doctorModel.findOne({
      $or: [
        { employee_id: doctorIdStr, tenantId },
        { name: doctorIdStr, tenantId },
      ],
    }).exec();
    
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorIdStr} not found`);
    }
    return doctor._id as Types.ObjectId;
  }

  // --- Catalog ---
  async createTest(dto: CreateDiagnosticTestDto, userId: string, tenantId: string, username?: string) {
    const saved = await new this.testModel({ ...dto, tenantId, createdBy: username || userId, updatedBy: username || userId }).save();
    void this.auditService.log({ userId, action: 'create', entity: 'diagnostic_test', entityId: saved.id as string, newValue: saved.toObject(), tenantId });
    return saved;
  }

  async findAllTests(tenantId: string) {
    return this.testModel.find({ tenantId }).exec();
  }

  async updateTest(id: string, dto: UpdateDiagnosticTestDto, userId: string, tenantId: string, username?: string) {
    const old = await this.testModel.findOne({ _id: id, tenantId }).exec();
    if (!old) throw new NotFoundException('Diagnostic test not found');
    const updated = await this.testModel.findByIdAndUpdate(id, { ...dto, updatedBy: username || userId }, { new: true }).exec();
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
  async createBooking(dto: CreatePatientDiagnosticDto, userId: string, tenantId: string, username?: string) {
    // Resolve string IDs to MongoDB ObjectIds
    const patientId = await this.resolvePatientId(dto.patient_id, tenantId);
    const testId = await this.resolveTestId(dto.test_id, tenantId);
    const doctorId = await this.resolveDoctorId(dto.ordered_by_doctor_id, tenantId);

    const booking_number = this.generateBookingNumber();
    const bookingData = {
      ...dto,
      patient_id: patientId,
      test_id: testId,
      ordered_by_doctor_id: doctorId,
      booking_number,
      tenantId,
      createdBy: username || userId,
      updatedBy: username || userId,
    };

    const saved = await new this.bookingModel(bookingData).save();
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

  async updateBooking(id: string, dto: UpdatePatientDiagnosticDto, userId: string, tenantId: string, username?: string) {
    const old = await this.bookingModel.findOne({ _id: id, tenantId }).exec();
    if (!old) throw new NotFoundException('Booking not found');
    const updated = await this.bookingModel.findByIdAndUpdate(id, { ...dto, updatedBy: username || userId }, { new: true }).exec();
    void this.auditService.log({ userId, action: 'update', entity: 'patient_diagnostic', entityId: id, oldValue: old.toObject(), newValue: updated?.toObject(), tenantId });

    // Emit event for automatic hospital bill creation when diagnostic is completed
    if (dto.status === 'completed' && old.toObject().status !== 'completed') {
      const bookingObj = updated?.toObject() as any;
      const testDoc = await this.testModel.findById(bookingObj.test_id).lean();
      const testName = bookingObj.testName || testDoc?.name || 'Unknown Test';
      const testCategory = (testDoc as any)?.category || 'diagnostic';
      const price = bookingObj.price || (testDoc as any)?.price || 0;
      void this.kafkaService.sendEvent('billing-events', `diagnostic-${updated?.id}`, {
        eventType: 'diagnostic.completed',
        entity_id: updated?.id as string,
        entity_type: 'diagnostic_booking',
        patient_id: bookingObj.patient_id,
        booking_number: bookingObj.booking_number,
        test_name: testName,
        test_category: testCategory,
        price,
        items: [
          {
            name: testName,
            description: `Diagnostic Test - ${testCategory}`,
            quantity: 1,
            unit_price: price,
            subtotal: price,
            total: price,
          },
        ],
        tenantId,
        createdBy: userId,
        timestamp: new Date().toISOString(),
      }).catch(err => this.logger.error('Failed to emit diagnostic completion event', err));
    }

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
