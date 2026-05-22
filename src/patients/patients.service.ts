import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Patient, PatientDocument } from './schemas/patient.schema';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { AuditService } from '@audit/audit.service';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    private readonly auditService: AuditService,
  ) {}

  private generatePatientId(): string {
    return `PAT-${Date.now().toString(36).toUpperCase()}`;
  }

  async create(createPatientDto: CreatePatientDto, userId: string, tenantId: string) {
    const patient_id = createPatientDto.patient_id || this.generatePatientId();
    const newPatient = new this.patientModel({
      ...createPatientDto,
      patient_id,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });
    const saved = await newPatient.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'patient',
      entityId: saved.id as string,
      newValue: saved.toObject(),
      tenantId,
    });

    return saved;
  }

  async findAll(
    tenantId: string,
    page = 1,
    limit = 20,
    search?: string,
    status?: string,
    department?: string,
  ) {
    const filter: Record<string, any> = { tenantId };
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { first_name: { $regex: search, $options: 'i' } },
        { last_name: { $regex: search, $options: 'i' } },
        { patient_id: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.patientModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      this.patientModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  async getStats(tenantId: string) {
    const [byStatus, byDepartment] = await Promise.all([
      this.patientModel.aggregate([
        { $match: { tenantId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.patientModel.aggregate([
        { $match: { tenantId, department: { $exists: true, $ne: null } } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
      ]),
    ]);
    return { byStatus, byDepartment };
  }

  async findOne(id: string, tenantId: string) {
    const patient = await this.patientModel.findOne({ _id: id, tenantId }).exec();
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async update(id: string, updatePatientDto: UpdatePatientDto, userId: string, tenantId: string) {
    const old = await this.patientModel.findOne({ _id: id, tenantId }).exec();
    if (!old) throw new NotFoundException('Patient not found');

    const updated = await this.patientModel
      .findByIdAndUpdate(id, { ...updatePatientDto, updatedBy: userId }, { new: true })
      .exec();

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'patient',
      entityId: id,
      oldValue: old.toObject(),
      newValue: updated?.toObject(),
      tenantId,
    });

    return updated;
  }

  async remove(id: string, userId: string, tenantId: string) {
    const removed = await this.patientModel.findOneAndDelete({ _id: id, tenantId }).exec();
    if (!removed) throw new NotFoundException('Patient not found');

    void this.auditService.log({
      userId,
      action: 'delete',
      entity: 'patient',
      entityId: id,
      oldValue: removed.toObject(),
      tenantId,
    });

    return { id };
  }
}
