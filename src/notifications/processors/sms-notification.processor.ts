import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaService } from '../../kafka/kafka.service';
import { ChannelNotificationEvent } from '../dto/notification-event.dto';

/**
 * SMS Notification Processor
 *
 * Consumes `sms-notifications` topic and sends SMS messages.
 *
 * Current implementation: structured log stub.
 * To activate: inject Twilio / AWS SNS / custom SMS provider.
 *
 * Environment variables needed:
 *   SMS_PROVIDER=twilio|sns|custom
 *   TWILIO_ACCOUNT_SID=...
 *   TWILIO_AUTH_TOKEN=...
 *   TWILIO_FROM_NUMBER=+1xxxxxxxxxx
 */
@Injectable()
export class SmsNotificationProcessor implements OnModuleInit {
  private readonly logger = new Logger(SmsNotificationProcessor.name);

  constructor(private readonly kafkaService: KafkaService) {}

  async onModuleInit() {
    await this.kafkaService.createConsumer(
      'sms-notification-processor-group',
      ['sms-notifications'],
      (message) => this.process(message as ChannelNotificationEvent),
    );
    this.logger.log('SmsNotificationProcessor ready');
  }

  private async process(event: ChannelNotificationEvent) {
    try {
      await this.sendSms(event);
    } catch (err) {
      this.logger.error(`Failed to send SMS to ${event.targetPhone}`, err);
    }
  }

  private async sendSms(event: ChannelNotificationEvent): Promise<void> {
    // TODO: Replace with real SMS provider call
    // Example with Twilio:
    //   const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    //   await client.messages.create({
    //     body: `${event.title}: ${event.message}`,
    //     from: process.env.TWILIO_FROM_NUMBER,
    //     to: event.targetPhone,
    //   });

    this.logger.log(
      `[SMS STUB] To: ${event.targetPhone} | Message: ${event.title}: ${event.message}`,
    );
  }
}
