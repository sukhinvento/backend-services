import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DiagnosticsController } from './diagnostics.controller';
import { DiagnosticsService } from './diagnostics.service';
import { DiagnosticTest, DiagnosticTestSchema } from './schemas/diagnostic-test.schema';
import { PatientDiagnostic, PatientDiagnosticSchema } from './schemas/patient-diagnostic.schema';
import { AuthModule } from '@auth/auth.module';
import { CommonModule } from '@common/common.module';
import { AuditModule } from '@audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DiagnosticTest.name, schema: DiagnosticTestSchema },
      { name: PatientDiagnostic.name, schema: PatientDiagnosticSchema },
    ]),
    AuthModule,
    CommonModule,
    AuditModule,
  ],
  controllers: [DiagnosticsController],
  providers: [DiagnosticsService],
  exports: [DiagnosticsService],
})
export class DiagnosticsModule {}
