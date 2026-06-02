import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Medication, MedicationDocument } from './schemas/medication.schema';
import { PatientMedication, PatientMedicationDocument } from './schemas/patient-medication.schema';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { CreatePatientMedicationDto } from './dto/create-patient-medication.dto';
import { UpdatePatientMedicationDto } from './dto/update-patient-medication.dto';
import { AuditService } from '@audit/audit.service';

@Injectable()
export class MedicationsService {
  constructor(
    @InjectModel(Medication.name) private medicationModel: Model<MedicationDocument>,
    @InjectModel(PatientMedication.name) private prescriptionModel: Model<PatientMedicationDocument>,
    private readonly auditService: AuditService,
  ) {}

  private generatePrescriptionNumber(): string {
    return `RX-${Date.now().toString(36).toUpperCase()}`;
  }

  // --- Catalog ---
  async createMedication(dto: CreateMedicationDto, userId: string, tenantId: string, username?: string) {
    const saved = await new this.medicationModel({ ...dto, tenantId, createdBy: username || userId, updatedBy: username || userId }).save();
    void this.auditService.log({ userId, action: 'create', entity: 'medication', entityId: saved.id as string, newValue: saved.toObject(), tenantId });
    return saved;
  }

  async findAllMedications(tenantId: string) {
    return this.medicationModel.find({ tenantId }).exec();
  }

  async findOneMedication(id: string, tenantId: string) {
    const m = await this.medicationModel.findOne({ _id: id, tenantId }).exec();
    if (!m) throw new NotFoundException('Medication not found');
    return m;
  }

  async updateMedication(id: string, dto: UpdateMedicationDto, userId: string, tenantId: string, username?: string) {
    const old = await this.medicationModel.findOne({ _id: id, tenantId }).exec();
    if (!old) throw new NotFoundException('Medication not found');
    const updated = await this.medicationModel.findByIdAndUpdate(id, { ...dto, updatedBy: username || userId }, { new: true }).exec();
    void this.auditService.log({ userId, action: 'update', entity: 'medication', entityId: id, oldValue: old.toObject(), newValue: updated?.toObject(), tenantId });
    return updated;
  }

  async removeMedication(id: string, userId: string, tenantId: string) {
    const removed = await this.medicationModel.findOneAndDelete({ _id: id, tenantId }).exec();
    if (!removed) throw new NotFoundException('Medication not found');
    void this.auditService.log({ userId, action: 'delete', entity: 'medication', entityId: id, oldValue: removed.toObject(), tenantId });
    return { id };
  }

  // --- Prescriptions ---
  async createPrescription(dto: CreatePatientMedicationDto, userId: string, tenantId: string, username?: string) {
    const prescription_number = this.generatePrescriptionNumber();
    const saved = await new this.prescriptionModel({ ...dto, prescription_number, tenantId, createdBy: username || userId, updatedBy: username || userId }).save();
    void this.auditService.log({ userId, action: 'create', entity: 'patient_medication', entityId: saved.id as string, newValue: saved.toObject(), tenantId });
    return saved;
  }

  async findAllPrescriptions(tenantId: string, patient_id?: string, status?: string) {
    const filter: Record<string, any> = { tenantId };
    if (patient_id) filter.patient_id = patient_id;
    if (status) filter.status = status;
    return this.prescriptionModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOnePrescription(id: string, tenantId: string) {
    const p = await this.prescriptionModel.findOne({ _id: id, tenantId }).exec();
    if (!p) throw new NotFoundException('Prescription not found');
    return p;
  }

  async updatePrescription(id: string, dto: UpdatePatientMedicationDto, userId: string, tenantId: string, username?: string) {
    const old = await this.prescriptionModel.findOne({ _id: id, tenantId }).exec();
    if (!old) throw new NotFoundException('Prescription not found');
    const updated = await this.prescriptionModel.findByIdAndUpdate(id, { ...dto, updatedBy: username || userId }, { new: true }).exec();
    void this.auditService.log({ userId, action: 'update', entity: 'patient_medication', entityId: id, oldValue: old.toObject(), newValue: updated?.toObject(), tenantId });
    return updated;
  }

  async removePrescription(id: string, userId: string, tenantId: string) {
    const removed = await this.prescriptionModel.findOneAndDelete({ _id: id, tenantId }).exec();
    if (!removed) throw new NotFoundException('Prescription not found');
    void this.auditService.log({ userId, action: 'delete', entity: 'patient_medication', entityId: id, oldValue: removed.toObject(), tenantId });
    return { id };
  }
}
