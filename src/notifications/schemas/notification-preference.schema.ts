import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type NotificationPreferenceDocument = NotificationPreference & Document;

/**
 * Notification categories that map to Kafka event categories.
 * Each category can be configured independently per delivery channel.
 */
export const NOTIFICATION_CATEGORIES = [
  'system',
  'inventory',
  'stock_transfer',
  'purchase_order',
  'sales_order',
  'patient',
  'admission',
  'diagnostic',
  'billing',
  'invoice',
  'vendor',
  'doctor',
  'opd_visit',
] as const;

export type NotificationCategory = typeof NOTIFICATION_CATEGORIES[number];

/**
 * Per-category channel preferences.
 * Platform (in-app) is always on and cannot be disabled.
 */
export interface ChannelPreference {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}

const DEFAULT_CHANNEL_PREFERENCE: ChannelPreference = {
  email: false,
  sms: false,
  whatsapp: false,
};

@Schema({ timestamps: true })
export class NotificationPreference extends BaseSchema {
  @Prop({ required: true, index: true })
  userId: string;         // references auth user _id

  @Prop({ required: true, index: true })
  tenantId: string;

  /**
   * Map of category → channel toggles.
   * Stored as a plain object; Mongoose Mixed handles it.
   * Shape: { inventory: { email: true, sms: false, whatsapp: false }, ... }
   */
  @Prop({
    type: Object,
    default: () =>
      Object.fromEntries(
        NOTIFICATION_CATEGORIES.map(c => [c, { ...DEFAULT_CHANNEL_PREFERENCE }]),
      ),
  })
  channels: Record<NotificationCategory, ChannelPreference>;
}

export const NotificationPreferenceSchema = SchemaFactory.createForClass(NotificationPreference);
NotificationPreferenceSchema.index({ userId: 1, tenantId: 1 }, { unique: true });
