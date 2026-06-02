import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(
    dto: CreateNotificationDto,
    tenantId: string,
  ): Promise<Notification> {
    const notification = new this.notificationModel({
      ...dto,
      tenantId,
      isRead: false,
      createdBy: dto.userId,
      updatedBy: dto.userId,
    });
    return notification.save();
  }

  /**
   * Create a notification for all users in a tenant (broadcast).
   * For now, targets a single userId; can be extended later for broadcast.
   */
  async notify(
    tenantId: string,
    userId: string,
    title: string,
    message: string,
    options?: {
      type?: string;
      category?: string;
      entityId?: string;
      entityType?: string;
      actionUrl?: string;
    },
  ): Promise<Notification> {
    const notification = new this.notificationModel({
      tenantId,
      userId,
      title,
      message,
      type: options?.type || 'info',
      category: options?.category || 'system',
      entityId: options?.entityId,
      entityType: options?.entityType,
      actionUrl: options?.actionUrl,
      isRead: false,
      createdBy: 'system',
      updatedBy: 'system',
    });
    return notification.save();
  }

  async findAll(
    userId: string,
    tenantId: string,
    options?: { limit?: number; offset?: number; unreadOnly?: boolean },
  ) {
    const query: Record<string, any> = { userId, tenantId };
    if (options?.unreadOnly) {
      query.isRead = false;
    }

    const limit = Math.min(options?.limit || 25, 50);
    const offset = options?.offset || 0;

    const [items, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean()
        .exec(),
      this.notificationModel.countDocuments(query),
      this.notificationModel.countDocuments({
        userId,
        tenantId,
        isRead: false,
      }),
    ]);

    return { items, total, unreadCount, limit, offset };
  }

  async getUnreadCount(userId: string, tenantId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId,
      tenantId,
      isRead: false,
    });
  }

  async markAsRead(
    notificationId: string,
    userId: string,
    tenantId: string,
  ): Promise<Notification | null> {
    return this.notificationModel
      .findOneAndUpdate(
        { _id: notificationId, userId, tenantId },
        { isRead: true, readAt: new Date(), updatedBy: userId },
        { new: true },
      )
      .exec();
  }

  async markAllAsRead(userId: string, tenantId: string) {
    const result = await this.notificationModel.updateMany(
      { userId, tenantId, isRead: false },
      { isRead: true, readAt: new Date(), updatedBy: userId },
    );
    return { modifiedCount: result.modifiedCount };
  }
}
