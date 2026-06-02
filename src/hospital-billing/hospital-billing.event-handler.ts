import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { KafkaService, KafkaMessage } from '@kafka/kafka.service';
import { HospitalBillingService } from './hospital-billing.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomDocument } from '@rooms/schemas/room.schema';

@Injectable()
export class HospitalBillingEventHandler implements OnModuleInit {
  private readonly logger = new Logger(HospitalBillingEventHandler.name);

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly hospitalBillingService: HospitalBillingService,
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
  ) {}

  async onModuleInit() {
    await this.initializeConsumer();
  }

  private async initializeConsumer() {
    try {
      // Ensure the topic exists
      await this.kafkaService.ensureTopicExists('billing-events', 1, 1);

      // Create consumer for patient and diagnostic events
      await this.kafkaService.createConsumer(
        'hospital-billing-event-group',
        ['billing-events'],
        this.handleEvent.bind(this),
      );

      this.logger.log('Hospital billing event handler initialized');
    } catch (error) {
      this.logger.error('Failed to initialize hospital billing event handler', error);
      throw error;
    }
  }

  private async handleEvent(message: KafkaMessage) {
    try {
      switch (message.eventType) {
        case 'patient.discharge.completed':
          await this.handlePatientDischarge(message);
          break;
        case 'diagnostic.completed':
          await this.handleDiagnosticCompletion(message);
          break;
        default:
          this.logger.debug(`Ignoring event type: ${message.eventType}`);
      }
    } catch (error) {
      this.logger.error(`Error handling event: ${message.eventType}`, error);
    }
  }

  private async handlePatientDischarge(event: KafkaMessage) {
    try {
      // Calculate room charges based on admission dates
      const nightsStayed = this.calculateNightsStayed(
        event.admission_date,
        event.actual_discharge_date,
      );

      // Get room daily rate
      const roomDailyRate = await this.getRoomDailyRate(event.room_id);

      const billDto = {
        patient_id: event.patient_id,
        admission_id: event.admission_id,
        source_entity_id: event.admission_id || event.entity_id,
        issued_date: new Date(),
        status: 'issued',
        line_items: [
          {
            description: 'Room Charges',
            category: 'room_charges',
            quantity: nightsStayed,
            unit_price: roomDailyRate,
            discount_percent: 0,
          },
        ],
      };

      const bill = await this.hospitalBillingService.create(
        billDto,
        event.createdBy,
        event.tenantId,
      );

      this.logger.log(
        `Hospital bill created for discharge ${event.admission_number}: ${bill.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create hospital bill for discharge ${event.admission_number}`,
        error,
      );
    }
  }

  private async handleDiagnosticCompletion(event: KafkaMessage) {
    try {
      const billDto = {
        patient_id: event.patient_id,
        source_entity_id: event.entity_id,
        issued_date: new Date(),
        status: 'issued',
        line_items: [
          {
            description: event.test_name,
            category: 'diagnostic',
            quantity: 1,
            unit_price: event.price || 0,
            discount_percent: 0,
          },
        ],
      };

      const bill = await this.hospitalBillingService.create(
        billDto,
        event.createdBy,
        event.tenantId,
      );

      this.logger.log(
        `Hospital bill created for diagnostic ${event.booking_number}: ${bill.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create hospital bill for diagnostic ${event.booking_number}`,
        error,
      );
    }
  }

  private calculateNightsStayed(admissionDate: string, dischargeDate: string): number {
    const admission = new Date(admissionDate);
    const discharge = new Date(dischargeDate);
    const diffTime = Math.abs(discharge.getTime() - admission.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1; // At least 1 night
  }

  private async getRoomDailyRate(roomId: string): Promise<number> {
    try {
      const room = await this.roomModel.findById(roomId).lean().exec();
      if (!room) {
        this.logger.warn(`Room ${roomId} not found, using default rate`);
        return 1000; // Default room rate
      }
      return (room as any).daily_rate || 1000;
    } catch (error) {
      this.logger.warn(`Failed to fetch room daily rate, using default`, error);
      return 1000; // Default room rate
    }
  }
}
