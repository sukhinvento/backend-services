import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaService } from '../../kafka/kafka.service';
import { ChannelNotificationEvent } from '../dto/notification-event.dto';

/**
 * WhatsApp Notification Processor
 *
 * Consumes `whatsapp-notifications` topic and sends WhatsApp messages.
 *
 * Current implementation: structured log stub.
 * To activate: integrate with WhatsApp Business API (Meta Cloud API) or
 * a third-party provider like Twilio for WhatsApp, WATI, or 360Dialog.
 *
 * Environment variables needed:
 *   WHATSAPP_PROVIDER=meta|twilio|wati
 *   WHATSAPP_API_URL=https://graph.facebook.com/v18.0/
 *   WHATSAPP_API_TOKEN=...
 *   WHATSAPP_PHONE_NUMBER_ID=...
 *   WHATSAPP_TEMPLATE_NAME=notification_alert   (must be pre-approved by Meta)
 */
@Injectable()
export class WhatsappNotificationProcessor implements OnModuleInit {
  private readonly logger = new Logger(WhatsappNotificationProcessor.name);

  constructor(private readonly kafkaService: KafkaService) {}

  async onModuleInit() {
    await this.kafkaService.createConsumer(
      'whatsapp-notification-processor-group',
      ['whatsapp-notifications'],
      (message) => this.process(message as ChannelNotificationEvent),
    );
    this.logger.log('WhatsappNotificationProcessor ready');
  }

  private async process(event: ChannelNotificationEvent) {
    try {
      await this.sendWhatsapp(event);
    } catch (err) {
      this.logger.error(`Failed to send WhatsApp to ${event.targetPhone}`, err);
    }
  }

  private async sendWhatsapp(event: ChannelNotificationEvent): Promise<void> {
    // TODO: Replace with real WhatsApp provider call
    // Example with Meta Cloud API:
    //   await fetch(`${process.env.WHATSAPP_API_URL}${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    //     method: 'POST',
    //     headers: {
    //       Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       messaging_product: 'whatsapp',
    //       to: event.targetPhone,
    //       type: 'template',
    //       template: {
    //         name: process.env.WHATSAPP_TEMPLATE_NAME,
    //         language: { code: 'en_US' },
    //         components: [{ type: 'body', parameters: [
    //           { type: 'text', text: event.title },
    //           { type: 'text', text: event.message },
    //         ]}],
    //       },
    //     }),
    //   });

    this.logger.log(
      `[WHATSAPP STUB] To: ${event.targetPhone} | Title: ${event.title} | Message: ${event.message}`,
    );
  }
}
