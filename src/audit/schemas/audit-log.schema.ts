import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog extends BaseSchema {
  @Prop({ required: true })
  timestamp: Date;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  entity: string;

  @Prop({ required: true })
  entityId: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  oldValue: Record<string, any>;

  @Prop({ type: MongooseSchema.Types.Mixed })
  newValue: Record<string, any>;

  @Prop({ required: true })
  tenantId: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
