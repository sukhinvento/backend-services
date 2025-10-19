import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async log<T>(logData: CreateAuditLogDto<T>) {
    this.logger.info('AUDIT LOG', { ...logData });
    const newAuditLog = new this.auditLogModel({
      ...logData,
      timestamp: new Date(),
    });
    await newAuditLog.save();
  }
}
