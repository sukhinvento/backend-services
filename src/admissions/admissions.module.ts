import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdmissionsController } from './admissions.controller';
import { AdmissionsService } from './admissions.service';
import { Admission, AdmissionSchema } from './schemas/admission.schema';
import { Room, RoomSchema } from '../rooms/schemas/room.schema';
import { Patient, PatientSchema } from '../patients/schemas/patient.schema';
import { AuthModule } from '@auth/auth.module';
import { CommonModule } from '@common/common.module';
import { AuditModule } from '@audit/audit.module';
import { KafkaModule } from '@kafka/kafka.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admission.name, schema: AdmissionSchema },
      { name: Room.name, schema: RoomSchema },
      { name: Patient.name, schema: PatientSchema },
    ]),
    AuthModule,
    CommonModule,
    AuditModule,
    KafkaModule,
  ],
  controllers: [AdmissionsController],
  providers: [AdmissionsService],
  exports: [AdmissionsService],
})
export class AdmissionsModule {}
