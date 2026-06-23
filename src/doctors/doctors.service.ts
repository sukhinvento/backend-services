import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Doctor, DoctorDocument } from './schemas/doctor.schema';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { AuditService } from '@audit/audit.service';
import { CryptoService } from '@common/crypto/crypto.service';
import { DepartmentsService } from '../departments/departments.service';

const PII_FIELDS = ['name', 'dob', 'phone', 'email', 'registration_no'];
const SEARCHABLE_PII = ['phone', 'email'];

@Injectable()
export class DoctorsService {
  constructor(
    @InjectModel(Doctor.name) private doctorModel: Model<DoctorDocument>,
    private readonly auditService: AuditService,
    private readonly cryptoService: CryptoService,
    private readonly departmentsService: DepartmentsService,
  ) {}

  private encryptPii(data: Record<string, any>): Record<string, any> {
    const out = { ...data };
    for (const field of PII_FIELDS) {
      if (typeof out[field] === 'string' && out[field].length > 0) {
        if (SEARCHABLE_PII.includes(field)) {
          out[`${field}_search_hash`] = this.cryptoService.hmac(out[field].toLowerCase().trim());
        }
        out[field] = this.cryptoService.encrypt(out[field]);
      }
    }
    return out;
  }

  private decryptPii(doc: any): any {
    if (!doc) return doc;
    const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
    for (const field of PII_FIELDS) {
      if (typeof obj[field] === 'string' && obj[field].length > 0) {
        try { obj[field] = this.cryptoService.decrypt(obj[field]); } catch { /* leave as-is */ }
      }
    }
    return obj;
  }

  private decryptMany(docs: any[]): any[] {
    return docs.map(d => this.decryptPii(d));
  }

  private async validateDepartment(department: string, tenantId: string): Promise<void> {
    const valid = await this.departmentsService.validateDepartmentName(department, tenantId);
    if (!valid) {
      const available = await this.departmentsService.findActiveNames(tenantId);
      throw new BadRequestException(
        `Department "${department}" does not exist. Available departments: ${available.join(', ')}`,
      );
    }
  }

  async create(createDoctorDto: CreateDoctorDto, userId: string, tenantId: string, username?: string) {
    // Validate department against the Department collection
    if (createDoctorDto.department) {
      await this.validateDepartment(createDoctorDto.department, tenantId);
    }

    const encrypted = this.encryptPii({ ...createDoctorDto });
    const newDoctor = new this.doctorModel({
      ...encrypted,
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
      newValue: this.decryptPii(saved),
      tenantId,
    });

    return this.decryptPii(saved);
  }

  async findAll(
    tenantId: string,
    page = 1,
    limit = 25,
    search?: string,
    status?: string,
    department?: string,
  ) {
    const filter: Record<string, any> = { tenantId };
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (search) {
      const searchHash = this.cryptoService.hmac(search.toLowerCase().trim());
      filter.$or = [
        { employee_id: { $regex: search, $options: 'i' } },
        { specialisation: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { phone_search_hash: searchHash },
        { email_search_hash: searchHash },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.doctorModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).lean().exec(),
      this.doctorModel.countDocuments(filter).exec(),
    ]);

    return { data: this.decryptMany(data), total, page, limit };
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
    const doctor = await this.doctorModel.findOne({ _id: id, tenantId }).lean().exec();
    if (!doctor) throw new NotFoundException('Doctor not found');
    return this.decryptPii(doctor);
  }

  async update(id: string, updateDoctorDto: UpdateDoctorDto, userId: string, tenantId: string, username?: string) {
    const old = await this.doctorModel.findOne({ _id: id, tenantId }).lean().exec();
    if (!old) throw new NotFoundException('Doctor not found');

    // Validate department if it is being changed
    if (updateDoctorDto.department) {
      await this.validateDepartment(updateDoctorDto.department, tenantId);
    }

    const encrypted = this.encryptPii({ ...updateDoctorDto });
    const updated = await this.doctorModel
      .findByIdAndUpdate(id, { ...encrypted, updatedBy: username || userId }, { new: true })
      .lean()
      .exec();

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'doctor',
      entityId: id,
      oldValue: this.decryptPii(old),
      newValue: this.decryptPii(updated),
      tenantId,
    });

    return this.decryptPii(updated);
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
