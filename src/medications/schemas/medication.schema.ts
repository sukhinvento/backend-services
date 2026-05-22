import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type MedicationDocument = Medication & Document;

@Schema({ timestamps: true })
export class Medication extends BaseSchema {
  @Prop({ required: true })
  drug_code: string; // unique per tenant

  @Prop({ required: true })
  name: string;

  @Prop()
  generic_name: string;

  @Prop({
    type: String,
    enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'inhaler', 'other'],
  })
  dosage_form: string;

  @Prop()
  strength: string; // e.g. '500mg', '10mg/5ml'

  @Prop()
  price_per_unit: number;

  @Prop({ default: 0 })
  stock_quantity: number;

  @Prop()
  manufacturer: string;

  @Prop()
  category: string;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ required: true, index: true })
  tenantId: string;
}

export const MedicationSchema = SchemaFactory.createForClass(Medication);

MedicationSchema.index({ tenantId: 1, drug_code: 1 }, { unique: true });
MedicationSchema.index({ tenantId: 1, category: 1 });
MedicationSchema.index({ tenantId: 1, is_active: 1 });
