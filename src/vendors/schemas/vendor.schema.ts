import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type VendorDocument = Vendor & Document;

@Schema({ timestamps: true })
export class Vendor extends BaseSchema {
  @Prop({ required: true, unique: true })
  vendor_code: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  legal_name: string;

  @Prop({ required: true })
  tax_id: string;

  @Prop()
  address: string;

  @Prop([String])
  contact_persons: string[];

  @Prop()
  default_lead_time_days: number;

  @Prop()
  payment_terms: string;

  @Prop([String])
  supported_tax_slabs: string[];

  // Tax references - stores tax IDs from the Tax module
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Tax' }] })
  applicable_tax_ids: string[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Tax' })
  default_purchase_tax_id: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  custom_fields: Record<string, any>;
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);
