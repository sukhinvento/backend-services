import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, Consumer, logLevel } from 'kafkajs';

export interface KafkaMessage {
  eventType: string;
  entity_id: string;
  entity_type: string;
  tenantId: string;
  createdBy: string;
  timestamp: string;
  [key: string]: any;
}

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();

  constructor() {
    this.kafka = new Kafka({
      clientId: 'medsystem',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      logLevel: logLevel.ERROR,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.producer = this.kafka.producer({
      idempotent: true,
      maxInFlightRequests: 5,
    });
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.logger.log('Kafka Producer connected');
    } catch (error) {
      this.logger.error('Failed to connect Kafka Producer', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.producer.disconnect();
      for (const consumer of this.consumers.values()) {
        await consumer.disconnect();
      }
      this.logger.log('Kafka connections closed');
    } catch (error) {
      this.logger.error('Failed to disconnect Kafka', error);
    }
  }

  async sendEvent(topic: string, key: string, message: KafkaMessage): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key,
            value: JSON.stringify(message),
            headers: {
              'event-type': message.eventType,
              'tenant-id': message.tenantId,
              timestamp: message.timestamp,
            },
          },
        ],
      });

      this.logger.debug(
        `Event sent to topic: ${topic}, eventType: ${message.eventType}, entity: ${message.entity_type}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send event to topic ${topic}`, error);
      throw error;
    }
  }

  async createConsumer(
    groupId: string,
    topics: string[],
    messageHandler: (message: any) => Promise<void>,
  ): Promise<void> {
    try {
      const consumer = this.kafka.consumer({ groupId });

      await consumer.connect();
      await consumer.subscribe({ topics, fromBeginning: false });

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            if (!message.value) {
              this.logger.warn(`Received empty message from topic: ${topic}`);
              return;
            }
            const payload = JSON.parse(message.value.toString());
            this.logger.debug(`Processing message from topic: ${topic}, eventType: ${payload.eventType}`);
            await messageHandler(payload);
          } catch (error) {
            this.logger.error(`Error processing message from topic ${topic}`, error);
          }
        },
      });

      this.consumers.set(groupId, consumer);
      this.logger.log(`Kafka Consumer created for group: ${groupId}, topics: ${topics.join(', ')}`);
    } catch (error) {
      this.logger.error(`Failed to create consumer for group ${groupId}`, error);
      throw error;
    }
  }

  async ensureTopicExists(topicName: string, partitions: number = 1, replicationFactor: number = 1): Promise<void> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();

      const topics = await admin.listTopics();
      if (!topics.includes(topicName)) {
        await admin.createTopics({
          topics: [
            {
              topic: topicName,
              numPartitions: partitions,
              replicationFactor,
            },
          ],
        });
        this.logger.log(`Topic created: ${topicName}`);
      }

      await admin.disconnect();
    } catch (error) {
      this.logger.error(`Failed to ensure topic ${topicName} exists`, error);
      throw error;
    }
  }
}
