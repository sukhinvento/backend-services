import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationPreferenceService } from './notification-preference.service';
import { NotificationRouterService } from './notification-router.service';
import { NotificationEventService } from './notification-event.service';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { NotificationPreference, NotificationPreferenceSchema } from './schemas/notification-preference.schema';
import { PlatformNotificationProcessor } from './processors/platform-notification.processor';
import { EmailNotificationProcessor } from './processors/email-notification.processor';
import { SmsNotificationProcessor } from './processors/sms-notification.processor';
import { WhatsappNotificationProcessor } from './processors/whatsapp-notification.processor';
import { KafkaModule } from '../kafka/kafka.module';
import { User, UserSchema } from '../auth/schemas/user.schema';

@Global()
@Module({
  imports: [
    KafkaModule,
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationPreference.name, schema: NotificationPreferenceSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationPreferenceService,
    NotificationEventService,
    NotificationRouterService,
    PlatformNotificationProcessor,
    EmailNotificationProcessor,
    SmsNotificationProcessor,
    WhatsappNotificationProcessor,
  ],
  exports: [
    NotificationsService,
    NotificationPreferenceService,
    NotificationEventService,
  ],
})
export class NotificationsModule {}
