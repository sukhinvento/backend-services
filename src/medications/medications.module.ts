import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicationsController } from './medications.controller';
import { MedicationsService } from './medications.service';
import { Medication, MedicationSchema } from './schemas/medication.schema';
import { PatientMedication, PatientMedicationSchema } from './schemas/patient-medication.schema';
import { AuthModule } from '@auth/auth.module';
import { CommonModule } from '@common/common.module';
import { AuditModule } from '@audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Medication.name, schema: MedicationSchema },
      { name: PatientMedication.name, schema: PatientMedicationSchema },
    ]),
    AuthModule,
    CommonModule,
    AuditModule,
  ],
  controllers: [MedicationsController],
  providers: [MedicationsService],
  exports: [MedicationsService],
})
export class MedicationsModule {}
