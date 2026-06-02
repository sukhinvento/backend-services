import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User extends BaseSchema {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password_hash: string;

  @Prop()
  name: string;

  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop()
  department: string;

  @Prop()
  designation: string;

  @Prop()
  avatar_url: string;

  @Prop([String])
  roles: string[];

  @Prop([String])
  scopes: string[];

  @Prop({ type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' })
  status: string;

  @Prop({ required: true })
  tenantId: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
