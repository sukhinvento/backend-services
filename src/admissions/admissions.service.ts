import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admission, AdmissionDocument } from './schemas/admission.schema';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { UpdateAdmissionDto } from './dto/update-admission.dto';
import { AuditService } from '@audit/audit.service';

@Injectable()
export class AdmissionsService {
  constructor(
    @InjectModel(Admission.name) private admissionModel: Model<AdmissionDocument>,
    private readonly auditService: AuditService,
  ) {}

  private generateAdmissionNumber(): string {
    return `ADM-${Date.now().toString(36).toUpperCase()}`;
  }

  async create(
    createAdmissionDto: CreateAdmissionDto,
    userId: string,
    tenantId: string,
    roomModel: Model<any>,
    patientModel: Model<any>,
  ) {
    const admission_number = this.generateAdmissionNumber();
    const newAdmission = new this.admissionModel({
      ...createAdmissionDto,
      admission_number,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });
    const saved = await newAdmission.save();

    // Set room status to 'occupied' and increment occupied_beds
    await roomModel.findByIdAndUpdate(createAdmissionDto.room_id, {
      $set: { status: 'occupied' },
      $inc: { occupied_beds: 1 },
    });

    // Set patient status to 'admitted'
    await patientModel.findByIdAndUpdate(createAdmissionDto.patient_id, {
      $set: { status: 'admitted' },
    });

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'admission',
      entityId: saved.id as string,
      newValue: saved.toObject(),
      tenantId,
    });

    return saved;
  }

  async findAll(
    tenantId: string,
    status?: string,
    patient_id?: string,
    doctor_id?: string,
    room_id?: string,
  ) {
    const filter: Record<string, any> = { tenantId };
    if (status) filter.status = status;
    if (patient_id) filter.patient_id = patient_id;
    if (doctor_id) filter.doctor_id = doctor_id;
    if (room_id) filter.room_id = room_id;

    return this.admissionModel.find(filter).sort({ admission_date: -1 }).exec();
  }

  async findActive(tenantId: string) {
    return this.admissionModel.find({ tenantId, status: 'active' }).exec();
  }

  async findOne(id: string, tenantId: string) {
    const admission = await this.admissionModel.findOne({ _id: id, tenantId }).exec();
    if (!admission) throw new NotFoundException('Admission not found');
    return admission;
  }

  async update(id: string, updateAdmissionDto: UpdateAdmissionDto, userId: string, tenantId: string) {
    const old = await this.admissionModel.findOne({ _id: id, tenantId }).exec();
    if (!old) throw new NotFoundException('Admission not found');

    const updated = await this.admissionModel
      .findByIdAndUpdate(id, { ...updateAdmissionDto, updatedBy: userId }, { new: true })
      .exec();

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'admission',
      entityId: id,
      oldValue: old.toObject(),
      newValue: updated?.toObject(),
      tenantId,
    });

    return updated;
  }

  async discharge(
    id: string,
    userId: string,
    tenantId: string,
    roomModel: Model<any>,
    patientModel: Model<any>,
  ) {
    const admission = await this.admissionModel.findOne({ _id: id, tenantId }).exec();
    if (!admission) throw new NotFoundException('Admission not found');

    const updated = await this.admissionModel
      .findByIdAndUpdate(
        id,
        {
          status: 'discharged',
          actual_discharge_date: new Date(),
          updatedBy: userId,
        },
        { new: true },
      )
      .exec();

    // Decrement room occupied_beds
    await roomModel.findByIdAndUpdate(admission.room_id, {
      $inc: { occupied_beds: -1 },
    });

    // Set patient status back to 'active'
    await patientModel.findByIdAndUpdate(admission.patient_id, {
      $set: { status: 'active' },
    });

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'admission',
      entityId: id,
      oldValue: admission.toObject(),
      newValue: updated?.toObject(),
      tenantId,
    });

    return updated;
  }

  async getMonthlyAnalytics(tenantId: string, months = 12) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    const [admissionsAgg, dischargesAgg, avgLosAgg] = await Promise.all([
      this.admissionModel.aggregate([
        { $match: { tenantId, admission_date: { $gte: cutoff } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$admission_date' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.admissionModel.aggregate([
        { $match: { tenantId, actual_discharge_date: { $gte: cutoff }, status: 'discharged' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$actual_discharge_date' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.admissionModel.aggregate([
        { $match: { tenantId, status: 'discharged', actual_discharge_date: { $exists: true } } },
        {
          $project: {
            los: {
              $divide: [
                { $subtract: ['$actual_discharge_date', '$admission_date'] },
                86400000,
              ],
            },
          },
        },
        { $group: { _id: null, avgLos: { $avg: '$los' } } },
      ]),
    ]);

    const admMap: Record<string, number> = {};
    const disMap: Record<string, number> = {};
    admissionsAgg.forEach((r: any) => { admMap[r._id] = r.count; });
    dischargesAgg.forEach((r: any) => { disMap[r._id] = r.count; });
    const allMonths = [...new Set([...Object.keys(admMap), ...Object.keys(disMap)])].sort();

    return {
      monthly: allMonths.map(m => ({ month: m, admissions: admMap[m] ?? 0, discharges: disMap[m] ?? 0 })),
      avgLos: +(avgLosAgg[0]?.avgLos ?? 0).toFixed(1),
    };
  }

  async remove(id: string, userId: string, tenantId: string) {
    const removed = await this.admissionModel.findOneAndDelete({ _id: id, tenantId }).exec();
    if (!removed) throw new NotFoundException('Admission not found');

    void this.auditService.log({
      userId,
      action: 'delete',
      entity: 'admission',
      entityId: id,
      oldValue: removed.toObject(),
      tenantId,
    });

    return { id };
  }
}
