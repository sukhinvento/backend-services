import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';
import {
  FieldConfiguration,
  FieldConfigurationSchema,
} from './field-configuration.schema';

export type TenantDocument = Tenant & Document;

@Schema({ timestamps: true })
export class Tenant extends BaseSchema {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ type: Map, of: [FieldConfigurationSchema] })
  fieldConfigurations: Map<string, FieldConfiguration[]>;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
