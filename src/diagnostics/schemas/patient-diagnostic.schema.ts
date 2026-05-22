import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type PatientDiagnosticDocument = PatientDiagnostic & Document;

@Schema({ timestamps: true })
export class PatientDiagnostic extends BaseSchema {
  @Prop({ required: true })
  booking_number: string; // unique per tenant, auto-gen DIAG-XXXX

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Patient', required: true })
  patient_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'DiagnosticTest', required: true })
  test_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Doctor' })
  ordered_by_doctor_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  ordered_date: Date;

  @Prop({ type: Date })
  scheduled_date: Date;

  @Prop()
  scheduled_time: string;

  @Prop({ type: Date })
  completed_date: Date;

  @Prop({
    type: String,
    enum: ['ordered', 'pending', 'scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Prop({
    type: String,
    enum: ['routine', 'urgent', 'emergency', 'stat'],
    default: 'routine',
  })
  priority: string;

  @Prop()
  price: number;

  @Prop()
  results: string;

  @Prop()
  result_file_url: string;

  @Prop()
  notes: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Doctor' })
  technician_id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, index: true })
  tenantId: string;
}

export const PatientDiagnosticSchema = SchemaFactory.createForClass(PatientDiagnostic);

PatientDiagnosticSchema.index({ tenantId: 1, booking_number: 1 }, { unique: true });
PatientDiagnosticSchema.index({ tenantId: 1, status: 1 });
PatientDiagnosticSchema.index({ tenantId: 1, patient_id: 1 });
PatientDiagnosticSchema.index({ tenantId: 1, priority: 1 });
