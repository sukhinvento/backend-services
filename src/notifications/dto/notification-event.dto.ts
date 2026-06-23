/**
 * Shape of a message published to the `app-events` Kafka topic.
 * Every service should emit this structure when something notification-worthy happens.
 */
export interface NotificationEvent {
  eventType: string;        // e.g. 'purchase_order.created', 'inventory.low_stock'
  entity_id: string;
  entity_type: string;
  tenantId: string;
  createdBy: string;        // userId who triggered the event
  timestamp: string;        // ISO-8601

  // Human-readable notification content
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'error';

  // Optional navigation target when user clicks the notification
  actionUrl?: string;

  // Arbitrary extra data for processors
  metadata?: Record<string, any>;
}

/**
 * Shape of a message published to channel-specific topics:
 * `platform-notifications`, `email-notifications`, `sms-notifications`, `whatsapp-notifications`
 */
export interface ChannelNotificationEvent extends NotificationEvent {
  targetUserId: string;     // resolved recipient
  targetEmail?: string;     // resolved from user record
  targetPhone?: string;     // resolved from user record
  category: string;         // from eventTypeToCategory()
}
