import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HospitalBillingController } from './hospital-billing.controller';
import { HospitalBillingService } from './hospital-billing.service';
import { HospitalBill, HospitalBillSchema } from './schemas/hospital-bill.schema';
import { AuthModule } from '@auth/auth.module';
import { CommonModule } from '@common/common.module';
import { AuditModule } from '@audit/audit.module';
import { KafkaModule } from '@kafka/kafka.module';
import { HospitalBillingEventHandler } from './hospital-billing.event-handler';
import { Room, RoomSchema } from '@rooms/schemas/room.schema';
import { InvoicesModule } from '@invoices/invoices.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HospitalBill.name, schema: HospitalBillSchema },
      { name: Room.name, schema: RoomSchema },
    ]),
    AuthModule,
    CommonModule,
    AuditModule,
    KafkaModule,
    InvoicesModule,
  ],
  controllers: [HospitalBillingController],
  providers: [HospitalBillingService, HospitalBillingEventHandler],
  exports: [HospitalBillingService],
})
export class HospitalBillingModule {}
