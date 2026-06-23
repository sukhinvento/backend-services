import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/jwt-auth.guard';
import { RolesGuard, ScopesGuard } from '@common/guards';
import { Roles, TenantId } from '@common/decorators';
import { Role } from '@common/enums';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

@ApiTags('audit')
@ApiBearerAuth('JWT-auth')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class AuditController {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Query audit logs (Admin / Manager only)' })
  @ApiQuery({ name: 'entity', required: false, description: 'Filter by entity type (e.g. patient, doctor)' })
  @ApiQuery({ name: 'action', required: false, description: 'Filter by action (create, update, delete)' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user who performed the action' })
  @ApiQuery({ name: 'entityId', required: false, description: 'Filter by entity ID' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO 8601)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @TenantId() tenantId: string,
    @Query('entity') entity?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('entityId') entityId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = Math.min(limit ? parseInt(limit, 10) : 25, 100);
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = { tenantId };
    if (entity) filter.entity = entity;
    if (action) filter.action = action;
    if (userId) filter.userId = userId;
    if (entityId) filter.entityId = entityId;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const [data, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
        .exec(),
      this.auditLogModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page: pageNum, limit: limitNum };
  }
}
