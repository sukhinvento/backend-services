import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type OpdVisitDocument = OpdVisit & Document;

@Schema({ timestamps: true })
export class OpdVisit extends BaseSchema {
  @Prop({ required: true, index: true })
  visit_number: string;       // auto-gen OPD-XXXX

  @Prop({ required: true })
  token_number: string;       // e.g. "CARD-003"

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Patient', required: true })
  patient_id: MongooseSchema.Types.ObjectId;

  @Prop()
  patient_name: string;       // denormalized for display

  @Prop()
  patient_phone: string;      // denormalized

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Doctor', required: true })
  doctor_id: MongooseSchema.Types.ObjectId;

  @Prop()
  doctor_name: string;        // denormalized

  @Prop({ required: true })
  department: string;

  @Prop({ type: Date, default: () => new Date() })
  visit_date: Date;

  @Prop({
    type: String,
    enum: ['waiting', 'in_consultation', 'completed', 'cancelled'],
    default: 'waiting',
  })
  status: string;

  @Prop()
  chief_complaint: string;

  @Prop({ default: 0 })
  consultation_fee: number;

  @Prop({
    type: String,
    enum: ['cash', 'insurance', 'card', 'corporate', 'government'],
    default: 'cash',
  })
  payment_mode: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  vitals: {
    bp?: string;
    pulse?: number;
    temperature?: number;
    weight?: number;
    spo2?: number;
  };

  @Prop()
  consultation_notes: string;

  @Prop()
  prescription_notes: string;

  @Prop({ type: Date })
  follow_up_date: Date;

  @Prop({ default: 0 })
  queue_position: number;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  custom_fields: Record<string, any>;
}

export const OpdVisitSchema = SchemaFactory.createForClass(OpdVisit);

// Compound indexes for common query patterns
OpdVisitSchema.index({ tenantId: 1, visit_date: 1, department: 1 });
OpdVisitSchema.index({ tenantId: 1, doctor_id: 1, visit_date: 1 });
OpdVisitSchema.index({ tenantId: 1, token_number: 1, visit_date: 1 });
OpdVisitSchema.index({ tenantId: 1, patient_id: 1, visit_date: -1 });
OpdVisitSchema.index({ tenantId: 1, status: 1, visit_date: 1 });
OpdVisitSchema.index({ tenantId: 1, visit_number: 1 }, { unique: true });
