import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  NotificationPreference,
  NotificationPreferenceDocument,
  NOTIFICATION_CATEGORIES,
  ChannelPreference,
  NotificationCategory,
} from './schemas/notification-preference.schema';

@Injectable()
export class NotificationPreferenceService {
  constructor(
    @InjectModel(NotificationPreference.name)
    private prefModel: Model<NotificationPreferenceDocument>,
  ) {}

  /** Get or create preferences for a user. */
  async getPreferences(userId: string, tenantId: string): Promise<any> {
    let pref = await this.prefModel.findOne({ userId, tenantId }).lean().exec();
    if (!pref) {
      const channels = Object.fromEntries(
        NOTIFICATION_CATEGORIES.map(c => [c, { email: false, sms: false, whatsapp: false }]),
      ) as Record<NotificationCategory, ChannelPreference>;

      const created = await this.prefModel.create({
        userId,
        tenantId,
        channels,
        createdBy: userId,
        updatedBy: userId,
      });
      pref = created.toObject() as any;
    }
    return pref;
  }

  /** Update a single category's channel toggles. */
  async updateCategory(
    userId: string,
    tenantId: string,
    category: NotificationCategory,
    channels: Partial<ChannelPreference>,
  ): Promise<NotificationPreference> {
    const updateFields: Record<string, boolean> = {};
    if (channels.email !== undefined)    updateFields[`channels.${category}.email`]    = channels.email;
    if (channels.sms !== undefined)      updateFields[`channels.${category}.sms`]      = channels.sms;
    if (channels.whatsapp !== undefined) updateFields[`channels.${category}.whatsapp`] = channels.whatsapp;

    return this.prefModel.findOneAndUpdate(
      { userId, tenantId },
      { $set: { ...updateFields, updatedBy: userId } },
      { new: true, upsert: true },
    ).lean().exec();
  }

  /** Update all categories at once (used by the settings page full-save). */
  async updateAll(
    userId: string,
    tenantId: string,
    channels: Record<NotificationCategory, ChannelPreference>,
  ): Promise<NotificationPreference> {
    return this.prefModel.findOneAndUpdate(
      { userId, tenantId },
      { $set: { channels, updatedBy: userId } },
      { new: true, upsert: true },
    ).lean().exec();
  }

  /**
   * Given a user and a category, returns which external channels are enabled.
   * Platform is always considered enabled (no toggle needed).
   */
  async getChannelsForUser(
    userId: string,
    tenantId: string,
    category: NotificationCategory,
  ): Promise<{ platform: true; email: boolean; sms: boolean; whatsapp: boolean }> {
    const pref = await this.getPreferences(userId, tenantId);
    const cat = pref.channels?.[category] ?? { email: false, sms: false, whatsapp: false };
    return { platform: true, email: cat.email, sms: cat.sms, whatsapp: cat.whatsapp };
  }
}
