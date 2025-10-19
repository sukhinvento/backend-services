import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FieldConfigurationDocument = FieldConfiguration & Document;

@Schema()
export class FieldConfiguration {
  @Prop({ required: true })
  field_id: string;

  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  type: 'string' | 'enum' | 'boolean' | 'date';

  @Prop([String])
  values?: string[];

  @Prop({ required: true })
  required: boolean;
}

export const FieldConfigurationSchema =
  SchemaFactory.createForClass(FieldConfiguration);
