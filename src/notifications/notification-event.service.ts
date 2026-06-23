import { Injectable, Logger } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import { NotificationEvent } from './dto/notification-event.dto';

/**
 * NotificationEventService
 *
 * Thin facade that all business services use to emit notification events
 * to the `app-events` Kafka topic.  The NotificationRouterService picks
 * these up, resolves target users, and fans them out to channel processors.
 *
 * Usage:
 *   this.notifEventService.emit({
 *     eventType: 'inventory.low_stock',
 *     entity_id: item.id,
 *     entity_type: 'inventory_item',
 *     tenantId,
 *     createdBy: userId,
 *     timestamp: new Date().toISOString(),
 *     title: 'Low Stock Alert',
 *     message: `${item.name} stock is below minimum level (${item.current_stock} units remaining)`,
 *     severity: 'warning',
 *     actionUrl: '/inventory',
 *   });
 */
@Injectable()
export class NotificationEventService {
  private readonly logger = new Logger(NotificationEventService.name);

  constructor(private readonly kafkaService: KafkaService) {}

  emit(event: NotificationEvent): void {
    void this.kafkaService
      .sendEvent('app-events', `${event.entity_type}-${event.entity_id}`, event as any)
      .catch(err => this.logger.error(`Failed to emit notification event: ${event.eventType}`, err));
  }
}
