import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Doctor, DoctorDocument } from './schemas/doctor.schema';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { AuditService } from '@audit/audit.service';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectModel(Doctor.name) private doctorModel: Model<DoctorDocument>,
    private readonly auditService: AuditService,
  ) {}

  async create(createDoctorDto: CreateDoctorDto, userId: string, tenantId: string, username?: string) {
    const newDoctor = new this.doctorModel({
      ...createDoctorDto,
      tenantId,
      createdBy: username || userId,
      updatedBy: username || userId,
    });
    const saved = await newDoctor.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'doctor',
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
        { name: { $regex: search, $options: 'i' } },
        { employee_id: { $regex: search, $options: 'i' } },
        { specialisation: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.doctorModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      this.doctorModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  async getStats(tenantId: string) {
    const [byStatus, byDepartment, total, activePatients] = await Promise.all([
      this.doctorModel.aggregate([
        { $match: { tenantId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.doctorModel.aggregate([
        { $match: { tenantId } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
      ]),
      this.doctorModel.countDocuments({ tenantId }),
      this.doctorModel.aggregate([
        { $match: { tenantId, status: 'active' } },
        { $group: { _id: null, total: { $sum: '$active_patient_count' } } },
      ]),
    ]);

    const statusMap = Object.fromEntries(byStatus.map((s: any) => [s._id, s.count]));

    return {
      total,
      active: statusMap['active'] || 0,
      onLeave: statusMap['on_leave'] || 0,
      inactive: statusMap['inactive'] || 0,
      departments: byDepartment.length,
      totalActivePatients: activePatients[0]?.total || 0,
    };
  }

  async findOne(id: string, tenantId: string) {
    const doctor = await this.doctorModel.findOne({ _id: id, tenantId }).exec();
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  async update(id: string, updateDoctorDto: UpdateDoctorDto, userId: string, tenantId: string, username?: string) {
    const old = await this.doctorModel.findOne({ _id: id, tenantId }).exec();
    if (!old) throw new NotFoundException('Doctor not found');

    const updated = await this.doctorModel
      .findByIdAndUpdate(id, { ...updateDoctorDto, updatedBy: username || userId }, { new: true })
      .exec();

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'doctor',
      entityId: id,
      oldValue: old.toObject(),
      newValue: updated?.toObject(),
      tenantId,
    });

    return updated;
  }

  async remove(id: string, userId: string, tenantId: string) {
    const removed = await this.doctorModel.findOneAndDelete({ _id: id, tenantId }).exec();
    if (!removed) throw new NotFoundException('Doctor not found');

    void this.auditService.log({
      userId,
      action: 'delete',
      entity: 'doctor',
      entityId: id,
      oldValue: removed.toObject(),
      tenantId,
    });

    return { id };
  }
}
