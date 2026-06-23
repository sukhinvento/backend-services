import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OpdVisitsController } from './opd-visits.controller';
import { OpdVisitsService } from './opd-visits.service';
import { OpdVisit, OpdVisitSchema } from './schemas/opd-visit.schema';
import { AuthModule } from '@auth/auth.module';
import { CommonModule } from '@common/common.module';
import { AuditModule } from '@audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: OpdVisit.name, schema: OpdVisitSchema }]),
    AuthModule,
    CommonModule,
    AuditModule,
    NotificationsModule,
  ],
  controllers: [OpdVisitsController],
  providers: [OpdVisitsService],
  exports: [OpdVisitsService],
})
export class OpdVisitsModule {}
