import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type PatientDocument = Patient & Document;

@Schema({ timestamps: true })
export class Patient extends BaseSchema {
  @Prop({ required: true })
  patient_id: string; // unique per tenant, auto-generated like PAT-XXXX

  @Prop({ required: true })
  first_name: string; // @PII

  @Prop({ required: true })
  last_name: string; // @PII

  @Prop()
  gender: string;

  @Prop()
  dob: string; // @PII

  @Prop()
  phone: string; // @PII

  @Prop()
  phone_search_hash: string; // HMAC-based search

  @Prop()
  email: string; // @PII

  @Prop()
  email_search_hash: string;

  @Prop()
  address: string; // @PII

  @Prop()
  blood_group: string;

  @Prop()
  emergency_contact_name: string; // @PII

  @Prop()
  emergency_contact_phone: string; // @PII

  @Prop([String])
  allergies: string[];

  @Prop([String])
  existing_conditions: string[];

  @Prop()
  barcode: string;

  @Prop()
  rfid_tag: string;

  @Prop({
    type: String,
    enum: ['active', 'admitted', 'discharged', 'deceased'],
    default: 'active',
  })
  status: string;

  @Prop()
  department: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Doctor' })
  assigned_doctor_id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  custom_fields: Record<string, any>;

  // ── ABDM / ABHA fields (populated only when ABDM is enabled) ──────────────
  @Prop({ sparse: true })
  abha_number: string;       // 14-digit: "12-3456-7890-1234"

  @Prop({ sparse: true })
  abha_address: string;      // "patient@abdm"

  @Prop({ type: Date })
  abha_verified_at: Date;    // timestamp of successful ABHA verification

  @Prop({ default: false })
  abha_linked: boolean;      // quick flag for UI: show ABHA badge

  @Prop()
  abha_link_token: string;   // ephemeral token during linking flow (cleared after)
}

export const PatientSchema = SchemaFactory.createForClass(Patient);

PatientSchema.index({ tenantId: 1, status: 1 });
PatientSchema.index({ tenantId: 1, department: 1 });
PatientSchema.index({ phone_search_hash: 1 });
PatientSchema.index({ email_search_hash: 1 });
PatientSchema.index({ barcode: 1 });
PatientSchema.index({ patient_id: 1 });
PatientSchema.index({ tenantId: 1, patient_id: 1 }, { unique: true });
