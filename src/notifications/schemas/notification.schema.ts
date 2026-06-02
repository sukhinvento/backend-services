import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification extends BaseSchema {
  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({
    required: true,
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info',
  })
  type: string;

  @Prop({
    type: String,
    enum: [
      'system',
      'inventory',
      'purchase_order',
      'sales_order',
      'patient',
      'admission',
      'diagnostic',
      'billing',
      'invoice',
      'vendor',
      'doctor',
    ],
    default: 'system',
  })
  category: string;

  @Prop()
  entityId: string;

  @Prop()
  entityType: string;

  @Prop()
  actionUrl: string;

  @Prop({ default: false, index: true })
  isRead: boolean;

  @Prop()
  readAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Compound index for efficient queries
NotificationSchema.index({ userId: 1, tenantId: 1, isRead: 1, createdAt: -1 });
