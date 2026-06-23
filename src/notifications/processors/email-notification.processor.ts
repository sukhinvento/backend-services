import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaService } from '../../kafka/kafka.service';
import { ChannelNotificationEvent } from '../dto/notification-event.dto';

/**
 * Email Notification Processor
 *
 * Consumes the `email-notifications` topic and sends transactional emails.
 *
 * Current implementation: structured log stub.
 * To activate: inject an email provider (e.g. Nodemailer, SendGrid, AWS SES)
 * and call it inside `sendEmail()`.
 *
 * Environment variables needed for production:
 *   EMAIL_PROVIDER=sendgrid|smtp|ses
 *   SENDGRID_API_KEY=...
 *   SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS
 *   EMAIL_FROM=noreply@medsystem.io
 */
@Injectable()
export class EmailNotificationProcessor implements OnModuleInit {
  private readonly logger = new Logger(EmailNotificationProcessor.name);

  constructor(private readonly kafkaService: KafkaService) {}

  async onModuleInit() {
    await this.kafkaService.createConsumer(
      'email-notification-processor-group',
      ['email-notifications'],
      (message) => this.process(message as ChannelNotificationEvent),
    );
    this.logger.log('EmailNotificationProcessor ready');
  }

  private async process(event: ChannelNotificationEvent) {
    try {
      await this.sendEmail(event);
    } catch (err) {
      this.logger.error(`Failed to send email to ${event.targetEmail}`, err);
    }
  }

  private async sendEmail(event: ChannelNotificationEvent): Promise<void> {
    // TODO: Replace with real email provider call
    // Example with SendGrid:
    //   await sgMail.send({
    //     to: event.targetEmail,
    //     from: process.env.EMAIL_FROM,
    //     subject: event.title,
    //     text: event.message,
    //     html: `<p>${event.message}</p>`,
    //   });

    this.logger.log(
      `[EMAIL STUB] To: ${event.targetEmail} | Subject: ${event.title} | Body: ${event.message}`,
    );
  }
}
