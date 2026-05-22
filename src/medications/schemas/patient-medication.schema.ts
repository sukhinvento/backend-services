import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type PatientMedicationDocument = PatientMedication & Document;

@Schema({ timestamps: true })
export class PatientMedication extends BaseSchema {
  @Prop({ required: true })
  prescription_number: string; // unique, auto-gen RX-XXXX

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Patient', required: true })
  patient_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Medication', required: true })
  medication_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Doctor', required: true })
  prescribed_by_doctor_id: MongooseSchema.Types.ObjectId;

  @Prop()
  dosage_instructions: string; // e.g. '1 tablet twice daily'

  @Prop()
  frequency: string;

  @Prop()
  duration_days: number;

  @Prop()
  quantity: number;

  @Prop({ type: Date })
  start_date: Date;

  @Prop({ type: Date })
  end_date: Date;

  @Prop({
    type: String,
    enum: ['active', 'completed', 'discontinued'],
    default: 'active',
  })
  status: string;

  @Prop()
  total_cost: number;

  @Prop()
  notes: string;

  @Prop({ required: true, index: true })
  tenantId: string;
}

export const PatientMedicationSchema = SchemaFactory.createForClass(PatientMedication);

PatientMedicationSchema.index({ tenantId: 1, prescription_number: 1 }, { unique: true });
PatientMedicationSchema.index({ tenantId: 1, patient_id: 1 });
PatientMedicationSchema.index({ tenantId: 1, status: 1 });
