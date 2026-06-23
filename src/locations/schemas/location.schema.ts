import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type LocationDocument = Location & Document;

@Schema()
export class SubLocation {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['shelf', 'drawer', 'rack', 'bin'] })
  type: string;

  @Prop()
  capacity: number;
}

export const SubLocationSchema = SchemaFactory.createForClass(SubLocation);

@Schema({ timestamps: true })
export class Location extends BaseSchema {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true, enum: ['warehouse', 'pharmacy', 'clinic', 'hospital', 'store'] })
  type: string;

  @Prop()
  address: string;

  @Prop()
  city: string;

  @Prop()
  state: string;

  @Prop()
  pincode: string;

  @Prop()
  contact_person: string;

  @Prop()
  phone: string;

  @Prop()
  email: string;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ type: [SubLocationSchema], default: [] })
  sub_locations: SubLocation[];

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  custom_fields: Record<string, any>;
}

export const LocationSchema = SchemaFactory.createForClass(Location);
LocationSchema.index({ tenantId: 1, code: 1 }, { unique: true });
LocationSchema.index({ tenantId: 1, name: 1 }, { unique: true });
LocationSchema.index({ tenantId: 1, is_active: 1 });
