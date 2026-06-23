import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaService } from '../../kafka/kafka.service';
import { NotificationsService } from '../notifications.service';
import { ChannelNotificationEvent } from '../dto/notification-event.dto';

@Injectable()
export class PlatformNotificationProcessor implements OnModuleInit {
  private readonly logger = new Logger(PlatformNotificationProcessor.name);

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    await this.kafkaService.createConsumer(
      'platform-notification-processor-group',
      ['platform-notifications'],
      (message) => this.process(message as ChannelNotificationEvent),
    );
    this.logger.log('PlatformNotificationProcessor ready');
  }

  private async process(event: ChannelNotificationEvent) {
    try {
      await this.notificationsService.notify(
        event.tenantId,
        event.targetUserId,
        event.title,
        event.message,
        {
          type: event.severity,
          category: event.category,
          entityId: event.entity_id,
          entityType: event.entity_type,
          actionUrl: event.actionUrl,
        },
      );
      this.logger.debug(`Platform notification created for user ${event.targetUserId}: ${event.title}`);
    } catch (err) {
      this.logger.error(`Failed to create platform notification for ${event.targetUserId}`, err);
    }
  }
}
