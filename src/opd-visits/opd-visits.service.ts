import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OpdVisit, OpdVisitDocument } from './schemas/opd-visit.schema';
import { CreateOpdVisitDto } from './dto/create-opd-visit.dto';
import { UpdateOpdVisitDto, UpdateOpdVisitStatusDto } from './dto/update-opd-visit.dto';
import { AuditService } from '@audit/audit.service';
import { NotificationEventService } from '../notifications/notification-event.service';

@Injectable()
export class OpdVisitsService {
  private readonly logger = new Logger(OpdVisitsService.name);

  constructor(
    @InjectModel(OpdVisit.name) private opdVisitModel: Model<OpdVisitDocument>,
    private readonly auditService: AuditService,
    private readonly notifEvent: NotificationEventService,
  ) {}

  // ─── Token Generation ─────────────────────────────────────────────────────

  /**
   * Generates a department-prefixed token number for today's queue.
   * Format: CARD-001, ORTHO-012, GEN-003
   */
  private async generateToken(tenantId: string, department: string): Promise<{ token: string; position: number }> {
    const today = this.todayRange();
    const prefix = department.slice(0, 4).toUpperCase();

    const count = await this.opdVisitModel.countDocuments({
      tenantId,
      department,
      visit_date: { $gte: today.start, $lt: today.end },
    });

    const position = count + 1;
    const token = `${prefix}-${String(position).padStart(3, '0')}`;
    return { token, position };
  }

  private generateVisitNumber(): string {
    return `OPD-${Date.now().toString(36).toUpperCase()}`;
  }

  private todayRange(): { start: Date; end: Date } {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  async create(dto: CreateOpdVisitDto, userId: string, tenantId: string, username?: string) {
    const { token, position } = await this.generateToken(tenantId, dto.department);

    const visit = new this.opdVisitModel({
      ...dto,
      visit_number: this.generateVisitNumber(),
      token_number: token,
      queue_position: position,
      visit_date: new Date(),
      status: 'waiting',
      tenantId,
      createdBy: username || userId,
      updatedBy: username || userId,
    });

    const saved = await visit.save();

    void this.auditService.log({
      userId, action: 'create', entity: 'opd_visit',
      entityId: saved.id as string, newValue: saved.toObject(), tenantId,
    });

    // Notify the assigned doctor
    this.notifEvent.emit({
      eventType: 'opd_visit.created',
      entity_id: saved.id as string,
      entity_type: 'opd_visit',
      tenantId,
      createdBy: userId,
      timestamp: new Date().toISOString(),
      title: 'New OPD Patient',
      message: `Token ${token}: ${dto.patient_name || 'Patient'} — ${dto.chief_complaint}`,
      severity: 'info',
      actionUrl: '/patients',
      metadata: { token, department: dto.department, doctor: dto.doctor_name },
    });

    return saved;
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  async findAll(
    tenantId: string,
    options?: {
      page?: number; limit?: number;
      date?: string; department?: string;
      doctor_id?: string; status?: string;
      search?: string;
    },
  ) {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(options?.limit ?? 25, 100);
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { tenantId };

    if (options?.date) {
      const d = new Date(options.date);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      filter.visit_date = { $gte: d, $lt: end };
    }
    if (options?.department) filter.department = options.department;
    if (options?.doctor_id) filter.doctor_id = options.doctor_id;
    if (options?.status) filter.status = options.status;
    if (options?.search) {
      filter.$or = [
        { patient_name: { $regex: options.search, $options: 'i' } },
        { token_number: { $regex: options.search, $options: 'i' } },
        { visit_number: { $regex: options.search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.opdVisitModel.find(filter).sort({ queue_position: 1 }).skip(skip).limit(limit).lean().exec(),
      this.opdVisitModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  async findTodayQueue(tenantId: string, department?: string) {
    const today = this.todayRange();
    const filter: Record<string, any> = {
      tenantId,
      visit_date: { $gte: today.start, $lt: today.end },
    };
    if (department) filter.department = department;

    return this.opdVisitModel
      .find(filter)
      .sort({ queue_position: 1 })
      .lean()
      .exec();
  }

  async findOne(id: string, tenantId: string) {
    const visit = await this.opdVisitModel.findOne({ _id: id, tenantId }).lean().exec();
    if (!visit) throw new NotFoundException(`OPD visit ${id} not found`);
    return visit;
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateOpdVisitDto, userId: string, tenantId: string, username?: string) {
    const old = await this.opdVisitModel.findOne({ _id: id, tenantId });
    if (!old) throw new NotFoundException(`OPD visit ${id} not found`);

    const updated = await this.opdVisitModel.findOneAndUpdate(
      { _id: id, tenantId },
      { ...dto, updatedBy: username || userId },
      { new: true },
    ).lean().exec();

    void this.auditService.log({
      userId, action: 'update', entity: 'opd_visit',
      entityId: id, oldValue: old.toObject(), newValue: updated as any, tenantId,
    });

    return updated;
  }

  async updateStatus(id: string, dto: UpdateOpdVisitStatusDto, userId: string, tenantId: string, username?: string) {
    const visit = await this.opdVisitModel.findOne({ _id: id, tenantId });
    if (!visit) throw new NotFoundException(`OPD visit ${id} not found`);

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      waiting: ['in_consultation', 'cancelled'],
      in_consultation: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };
    const allowed = validTransitions[visit.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from '${visit.status}' to '${dto.status}'. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    const updated = await this.opdVisitModel.findOneAndUpdate(
      { _id: id, tenantId },
      { status: dto.status, updatedBy: username || userId },
      { new: true },
    ).lean().exec();

    void this.auditService.log({
      userId, action: 'update_status', entity: 'opd_visit',
      entityId: id, oldValue: { status: visit.status }, newValue: { status: dto.status }, tenantId,
    });

    // Notify on completion (can trigger billing downstream)
    if (dto.status === 'completed') {
      this.notifEvent.emit({
        eventType: 'opd_visit.completed',
        entity_id: id,
        entity_type: 'opd_visit',
        tenantId,
        createdBy: userId,
        timestamp: new Date().toISOString(),
        title: 'OPD Visit Completed',
        message: `${(visit as any).token_number}: ${(visit as any).patient_name || 'Patient'} consultation completed`,
        severity: 'success',
        actionUrl: '/patients',
        metadata: { token: (visit as any).token_number, department: (visit as any).department },
      });
    }

    return updated;
  }

  // ─── Delete (cancel) ──────────────────────────────────────────────────────

  async remove(id: string, userId: string, tenantId: string) {
    const visit = await this.opdVisitModel.findOne({ _id: id, tenantId });
    if (!visit) throw new NotFoundException(`OPD visit ${id} not found`);

    await this.opdVisitModel.findOneAndDelete({ _id: id, tenantId });

    void this.auditService.log({
      userId, action: 'delete', entity: 'opd_visit',
      entityId: id, oldValue: visit.toObject(), tenantId,
    });

    return { id };
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  async getStats(tenantId: string) {
    const today = this.todayRange();
    const filter = { tenantId, visit_date: { $gte: today.start, $lt: today.end } };

    const [total, waiting, inConsultation, completed, cancelled, byDept] = await Promise.all([
      this.opdVisitModel.countDocuments(filter),
      this.opdVisitModel.countDocuments({ ...filter, status: 'waiting' }),
      this.opdVisitModel.countDocuments({ ...filter, status: 'in_consultation' }),
      this.opdVisitModel.countDocuments({ ...filter, status: 'completed' }),
      this.opdVisitModel.countDocuments({ ...filter, status: 'cancelled' }),
      this.opdVisitModel.aggregate([
        { $match: filter },
        { $group: { _id: '$department', count: { $sum: 1 }, waiting: { $sum: { $cond: [{ $eq: ['$status', 'waiting'] }, 1, 0] } } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      today: { total, waiting, inConsultation, completed, cancelled },
      byDepartment: byDept.map((d: any) => ({ department: d._id, total: d.count, waiting: d.waiting })),
    };
  }
}
