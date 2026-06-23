import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KafkaService } from '../kafka/kafka.service';
import { NotificationPreferenceService } from './notification-preference.service';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { NotificationEvent, ChannelNotificationEvent } from './dto/notification-event.dto';
import {
  CATEGORY_SCOPE_MAP,
  APPROVAL_EVENT_TYPES,
  eventTypeToCategory,
} from './notification-routing.map';
import { NotificationCategory } from './schemas/notification-preference.schema';
import { ROLE_DEFAULT_SCOPES } from '../auth/permissions/permissions.matrix';
import { Role } from '../auth/enums/roles.enum';

const APP_EVENTS_TOPIC          = 'app-events';
const PLATFORM_NOTIF_TOPIC      = 'platform-notifications';
const EMAIL_NOTIF_TOPIC         = 'email-notifications';
const SMS_NOTIF_TOPIC           = 'sms-notifications';
const WHATSAPP_NOTIF_TOPIC      = 'whatsapp-notifications';

@Injectable()
export class NotificationRouterService implements OnModuleInit {
  private readonly logger = new Logger(NotificationRouterService.name);

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly prefService: NotificationPreferenceService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async onModuleInit() {
    await this.ensureTopics();
    await this.kafkaService.createConsumer(
      'notification-router-group',
      [APP_EVENTS_TOPIC],
      (message) => this.handleAppEvent(message as NotificationEvent),
    );
    this.logger.log('NotificationRouter initialized, listening on app-events');
  }

  private async ensureTopics() {
    const topics = [APP_EVENTS_TOPIC, PLATFORM_NOTIF_TOPIC, EMAIL_NOTIF_TOPIC, SMS_NOTIF_TOPIC, WHATSAPP_NOTIF_TOPIC];
    for (const topic of topics) {
      await this.kafkaService.ensureTopicExists(topic, 1, 1);
    }
  }

  /** Main handler: resolve target users, fan-out to channel topics. */
  private async handleAppEvent(event: NotificationEvent) {
    try {
      const category = eventTypeToCategory(event.eventType);
      const targetUsers = await this.resolveTargetUsers(event, category);

      if (targetUsers.length === 0) {
        this.logger.debug(`No target users for event ${event.eventType} in tenant ${event.tenantId}`);
        return;
      }

      this.logger.log(`Routing event ${event.eventType} to ${targetUsers.length} users`);

      for (const user of targetUsers) {
        await this.dispatchToUser(event, category, user);
      }
    } catch (err) {
      this.logger.error(`Error routing event ${event.eventType}`, err);
    }
  }

  /**
   * Resolve which users in the tenant should receive this notification.
   *
   * Rules:
   * 1. Admins always get everything.
   * 2. Approval events also go to managers.
   * 3. Users whose explicit scopes[] intersect with the category's required scopes.
   * 4. Fallback: users whose role's default scopes (from ROLE_DEFAULT_SCOPES) cover
   *    the required scopes — handles seeded/legacy users that have no scopes[] set.
   */
  private async resolveTargetUsers(
    event: NotificationEvent,
    category: NotificationCategory,
  ): Promise<UserDocument[]> {
    const { tenantId } = event;

    // System broadcasts go to all active users in the tenant
    if (category === 'system') {
      return this.userModel.find({ tenantId, status: { $in: ['active', null, undefined] } }).lean().exec() as any;
    }

    const requiredScopes = CATEGORY_SCOPE_MAP[category] ?? [];
    if (requiredScopes.length === 0) return [];

    const isApproval = APPROVAL_EVENT_TYPES.has(event.eventType);

    // Roles that cover at least one required scope (via the permissions matrix)
    const eligibleRoles: string[] = [Role.ADMIN];
    if (isApproval) eligibleRoles.push(Role.MANAGER);

    for (const [role, scopes] of Object.entries(ROLE_DEFAULT_SCOPES)) {
      if (role === Role.ADMIN) continue; // already added
      if (isApproval && role === Role.MANAGER) continue; // already added
      const hasOverlap = requiredScopes.some(s => (scopes as string[]).includes(s));
      if (hasOverlap) eligibleRoles.push(role);
    }

    // Match:
    //  a) users with an explicit scope assignment
    //  b) users whose role implies the scope (fallback for users without explicit scopes)
    const allUsers: any[] = await this.userModel
      .find({ tenantId, status: { $in: ['active', null, undefined] } })
      .lean()
      .exec();

    return allUsers.filter(user => {
      const userRoles: string[] = user.roles ?? [];
      const userScopes: string[] = user.scopes ?? [];

      // Admin always receives
      if (userRoles.includes(Role.ADMIN)) return true;

      // Explicit scope match
      if (userScopes.length > 0) {
        return requiredScopes.some(s => userScopes.includes(s));
      }

      // Role-based fallback (no explicit scopes assigned)
      return userRoles.some(r => eligibleRoles.includes(r));
    }) as any;
  }

  /** For one target user: check preferences and publish to each enabled channel. */
  private async dispatchToUser(
    event: NotificationEvent,
    category: NotificationCategory,
    user: any,
  ) {
    const userId = String(user._id);
    const channels = await this.prefService.getChannelsForUser(userId, event.tenantId, category);

    const payload: ChannelNotificationEvent = {
      ...event,
      targetUserId: (user._id as any).toString(),
      targetEmail: user.email,
      targetPhone: user.phone,
      category,
    };

    const key = `${event.entity_type}-${event.entity_id}-${userId}`;

    // Platform notification is always sent
    await this.kafkaService.sendEvent(PLATFORM_NOTIF_TOPIC, key, payload as any);

    if (channels.email && user.email) {
      await this.kafkaService.sendEvent(EMAIL_NOTIF_TOPIC, key, payload as any);
    }
    if (channels.sms && user.phone) {
      await this.kafkaService.sendEvent(SMS_NOTIF_TOPIC, key, payload as any);
    }
    if (channels.whatsapp && user.phone) {
      await this.kafkaService.sendEvent(WHATSAPP_NOTIF_TOPIC, key, payload as any);
    }
  }
}
