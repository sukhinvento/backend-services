import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { CommonModule } from '@common/common.module';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    CommonModule,
  ],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
