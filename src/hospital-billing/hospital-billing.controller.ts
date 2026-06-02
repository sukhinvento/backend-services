import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { HospitalBillingService } from './hospital-billing.service';
import { CreateHospitalBillDto } from './dto/create-hospital-bill.dto';
import { UpdateHospitalBillDto } from './dto/update-hospital-bill.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { JwtAuthGuard } from '@auth/jwt-auth.guard';
import { RolesGuard, ScopesGuard } from '@common/guards';
import { Roles, Scopes, TenantId } from '@common/decorators';
import { Role, Scope } from '@common/enums';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';

@ApiTags('hospital-billing')
@ApiBearerAuth('JWT-auth')
@Controller('hospital-billing')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class HospitalBillingController {
  constructor(private readonly hospitalBillingService: HospitalBillingService) {}

  @Post()
  @Scopes(Scope.HOSPITAL_BILLING)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Create a hospital bill' })
  create(
    @Body() dto: CreateHospitalBillDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.hospitalBillingService.create(dto, req.user.userId, tenantId, req.user.username);
  }

  @Get()
  @Scopes(Scope.HOSPITAL_BILLING)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF, Role.DOCTOR)
  @ApiOperation({ summary: 'Get all hospital bills' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'patient_id', required: false })
  findAll(
    @TenantId() tenantId: string,
    @Query('status') status?: string,
    @Query('patient_id') patient_id?: string,
  ) {
    return this.hospitalBillingService.findAll(tenantId, status, patient_id);
  }

  @Get('stats')
  @Scopes(Scope.HOSPITAL_BILLING)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Get billing statistics' })
  getStats(@TenantId() tenantId: string) {
    return this.hospitalBillingService.getStats(tenantId);
  }

  @Get('analytics/weekly')
  @Scopes(Scope.HOSPITAL_BILLING)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF, Role.VIEWER)
  @ApiOperation({ summary: 'Get weekly billing collection trend' })
  @ApiQuery({ name: 'weeks', required: false })
  getWeeklyAnalytics(@TenantId() tenantId: string, @Query('weeks') weeks?: string) {
    return this.hospitalBillingService.getWeeklyAnalytics(tenantId, weeks ? parseInt(weeks, 10) : 12);
  }

  @Get('analytics/monthly')
  @Scopes(Scope.HOSPITAL_BILLING)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF, Role.VIEWER)
  @ApiOperation({ summary: 'Get monthly billing revenue trend' })
  @ApiQuery({ name: 'months', required: false })
  getMonthlyAnalytics(@TenantId() tenantId: string, @Query('months') months?: string) {
    return this.hospitalBillingService.getMonthlyAnalytics(tenantId, months ? parseInt(months, 10) : 12);
  }

  @Get(':id')
  @Scopes(Scope.HOSPITAL_BILLING)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF, Role.DOCTOR)
  @ApiOperation({ summary: 'Get a hospital bill by ID' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.hospitalBillingService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Scopes(Scope.HOSPITAL_BILLING)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Update a hospital bill' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHospitalBillDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.hospitalBillingService.update(id, dto, req.user.userId, tenantId, req.user.username);
  }

  @Post(':id/issue')
  @Scopes(Scope.HOSPITAL_BILLING)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Issue a hospital bill' })
  issue(@Param('id') id: string, @Req() req: RequestWithUser, @TenantId() tenantId: string) {
    return this.hospitalBillingService.issue(id, req.user.userId, tenantId, req.user.username);
  }

  @Post(':id/pay')
  @Scopes(Scope.HOSPITAL_BILLING)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Record payment for a bill' })
  pay(
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.hospitalBillingService.recordPayment(id, dto, req.user.userId, tenantId, req.user.username);
  }

  @Delete(':id')
  @Scopes(Scope.HOSPITAL_BILLING)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a draft hospital bill' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser, @TenantId() tenantId: string) {
    return this.hospitalBillingService.remove(id, req.user.userId, tenantId);
  }
}
