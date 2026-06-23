import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Patient, PatientDocument } from './schemas/patient.schema';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { AuditService } from '@audit/audit.service';
import { CryptoService } from '@common/crypto/crypto.service';

// Fields stored encrypted at rest in MongoDB
const PII_FIELDS = ['first_name', 'last_name', 'dob', 'phone', 'email', 'address', 'emergency_contact_name', 'emergency_contact_phone'];
// Fields that also get a searchable HMAC hash companion
const SEARCHABLE_PII = ['phone', 'email'];

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    private readonly auditService: AuditService,
    private readonly cryptoService: CryptoService,
  ) {}

  private generatePatientId(): string {
    return `PAT-${Date.now().toString(36).toUpperCase()}`;
  }

  /** Encrypt PII fields and compute search hashes before writing to DB */
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

  /** Decrypt PII fields on records fetched from DB */
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

  /** Decrypt all records in an array */
  private decryptMany(docs: any[]): any[] {
    return docs.map(d => this.decryptPii(d));
  }

  async create(createPatientDto: CreatePatientDto, userId: string, tenantId: string, username?: string) {
    const patient_id = createPatientDto.patient_id || this.generatePatientId();
    const encrypted = this.encryptPii({ ...createPatientDto });
    const newPatient = new this.patientModel({
      ...encrypted,
      patient_id,
      tenantId,
      createdBy: username || userId,
      updatedBy: username || userId,
    });
    const saved = await newPatient.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'patient',
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
      // Search by HMAC hash for encrypted fields, regex for plain fields
      const searchHash = this.cryptoService.hmac(search.toLowerCase().trim());
      filter.$or = [
        { patient_id: { $regex: search, $options: 'i' } },
        { phone_search_hash: searchHash },
        { email_search_hash: searchHash },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.patientModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).lean().exec(),
      this.patientModel.countDocuments(filter).exec(),
    ]);

    return { data: this.decryptMany(data), total, page, limit };
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
    const patient = await this.patientModel.findOne({ _id: id, tenantId }).lean().exec();
    if (!patient) throw new NotFoundException('Patient not found');
    return this.decryptPii(patient);
  }

  async update(id: string, updatePatientDto: UpdatePatientDto, userId: string, tenantId: string, username?: string) {
    const old = await this.patientModel.findOne({ _id: id, tenantId }).lean().exec();
    if (!old) throw new NotFoundException('Patient not found');

    const encrypted = this.encryptPii({ ...updatePatientDto });
    const updated = await this.patientModel
      .findByIdAndUpdate(id, { ...encrypted, updatedBy: username || userId }, { new: true })
      .lean()
      .exec();

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'patient',
      entityId: id,
      oldValue: this.decryptPii(old),
      newValue: this.decryptPii(updated),
      tenantId,
    });

    return this.decryptPii(updated);
  }

  async remove(id: string, userId: string, tenantId: string) {
    const removed = await this.patientModel.findOneAndDelete({ _id: id, tenantId }).lean().exec();
    if (!removed) throw new NotFoundException('Patient not found');

    void this.auditService.log({
      userId,
      action: 'delete',
      entity: 'patient',
      entityId: id,
      oldValue: this.decryptPii(removed),
      tenantId,
    });

    return { id };
  }
}
