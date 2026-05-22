import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type AdmissionDocument = Admission & Document;

@Schema({ timestamps: true })
export class Admission extends BaseSchema {
  @Prop({ required: true })
  admission_number: string; // unique per tenant, auto-gen ADM-XXXX

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Patient', required: true })
  patient_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Room', required: true })
  room_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Doctor', required: true })
  doctor_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  admission_date: Date;

  @Prop({ type: Date })
  expected_discharge_date: Date;

  @Prop({ type: Date })
  actual_discharge_date: Date;

  @Prop({
    required: true,
    type: String,
    enum: ['planned', 'emergency', 'transfer', 'day_care'],
  })
  admission_type: string;

  @Prop({
    type: String,
    enum: ['active', 'discharged', 'transferred'],
    default: 'active',
  })
  status: string;

  @Prop()
  discharge_summary: string;

  @Prop()
  notes: string;

  @Prop({
    type: String,
    enum: ['cash', 'insurance', 'card', 'corporate', 'government'],
  })
  payment_mode: string;

  @Prop()
  insurance_provider: string;

  @Prop()
  insurance_policy_no: string;

  @Prop()
  corporate_account: string;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  custom_fields: Record<string, any>;
}

export const AdmissionSchema = SchemaFactory.createForClass(Admission);

AdmissionSchema.index({ tenantId: 1, admission_number: 1 }, { unique: true });
AdmissionSchema.index({ tenantId: 1, status: 1 });
AdmissionSchema.index({ tenantId: 1, patient_id: 1 });
AdmissionSchema.index({ tenantId: 1, doctor_id: 1 });
AdmissionSchema.index({ tenantId: 1, room_id: 1 });
