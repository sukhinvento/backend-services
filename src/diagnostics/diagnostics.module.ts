import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DiagnosticsController } from './diagnostics.controller';
import { DiagnosticsService } from './diagnostics.service';
import { DiagnosticTest, DiagnosticTestSchema } from './schemas/diagnostic-test.schema';
import { PatientDiagnostic, PatientDiagnosticSchema } from './schemas/patient-diagnostic.schema';
import { Patient, PatientSchema } from '@patients/schemas/patient.schema';
import { Doctor, DoctorSchema } from '@doctors/schemas/doctor.schema';
import { AuthModule } from '@auth/auth.module';
import { CommonModule } from '@common/common.module';
import { AuditModule } from '@audit/audit.module';
import { KafkaModule } from '@kafka/kafka.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DiagnosticTest.name, schema: DiagnosticTestSchema },
      { name: PatientDiagnostic.name, schema: PatientDiagnosticSchema },
      { name: Patient.name, schema: PatientSchema },
      { name: Doctor.name, schema: DoctorSchema },
    ]),
    AuthModule,
    CommonModule,
    AuditModule,
    KafkaModule,
  ],
  controllers: [DiagnosticsController],
  providers: [DiagnosticsService],
  exports: [DiagnosticsService],
})
export class DiagnosticsModule {}
