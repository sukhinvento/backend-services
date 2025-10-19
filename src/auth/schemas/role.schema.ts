import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type RoleDocument = Role & Document;

@Schema({ timestamps: true })
export class Role extends BaseSchema {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop([String])
  scopes: string[];
}

export const RoleSchema = SchemaFactory.createForClass(Role);
