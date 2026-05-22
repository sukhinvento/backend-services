import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HospitalBillingController } from './hospital-billing.controller';
import { HospitalBillingService } from './hospital-billing.service';
import { HospitalBill, HospitalBillSchema } from './schemas/hospital-bill.schema';
import { AuthModule } from '@auth/auth.module';
import { CommonModule } from '@common/common.module';
import { AuditModule } from '@audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: HospitalBill.name, schema: HospitalBillSchema }]),
    AuthModule,
    CommonModule,
    AuditModule,
  ],
  controllers: [HospitalBillingController],
  providers: [HospitalBillingService],
  exports: [HospitalBillingService],
})
export class HospitalBillingModule {}
