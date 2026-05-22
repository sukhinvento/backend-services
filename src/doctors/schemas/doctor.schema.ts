import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type DoctorDocument = Doctor & Document;

@Schema({ timestamps: true })
export class Doctor extends BaseSchema {
  @Prop({ required: true })
  employee_id: string; // unique per tenant

  @Prop({ required: true })
  name: string; // @PII

  @Prop()
  gender: string;

  @Prop()
  dob: string; // @PII

  @Prop()
  phone: string; // @PII

  @Prop()
  phone_search_hash: string;

  @Prop()
  email: string; // @PII

  @Prop()
  email_search_hash: string;

  @Prop({ required: true })
  department: string;

  @Prop()
  specialisation: string;

  @Prop([String])
  qualification: string[];

  @Prop()
  experience_years: number;

  @Prop({
    type: String,
    enum: ['active', 'on_leave', 'inactive'],
    default: 'active',
  })
  status: string;

  @Prop({
    type: [
      {
        day: String,
        start_time: String,
        end_time: String,
      },
    ],
  })
  schedule: { day: string; start_time: string; end_time: string }[];

  @Prop()
  consultation_fee: number;

  @Prop()
  opd_slots_per_day: number;

  @Prop({ default: 0 })
  active_patient_count: number;

  @Prop()
  join_date: string;

  @Prop()
  registration_no: string; // @PII

  @Prop()
  bio: string;

  @Prop([String])
  languages: string[];

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  custom_fields: Record<string, any>;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);

DoctorSchema.index({ tenantId: 1, employee_id: 1 }, { unique: true });
DoctorSchema.index({ tenantId: 1, status: 1 });
DoctorSchema.index({ tenantId: 1, department: 1 });
DoctorSchema.index({ phone_search_hash: 1 });
DoctorSchema.index({ email_search_hash: 1 });
