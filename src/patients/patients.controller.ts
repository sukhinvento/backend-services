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
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { JwtAuthGuard } from '@auth/jwt-auth.guard';
import { RolesGuard, ScopesGuard } from '@common/guards';
import { Roles, Scopes, TenantId } from '@common/decorators';
import { Role, Scope } from '@common/enums';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';

@ApiTags('patients')
@ApiBearerAuth('JWT-auth')
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Scopes(Scope.PATIENTS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Create a new patient' })
  create(
    @Body() createPatientDto: CreatePatientDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.patientsService.create(createPatientDto, req.user.userId, tenantId, req.user.username);
  }

  @Get()
  @Scopes(Scope.PATIENTS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Get all patients' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'department', required: false })
  findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('department') department?: string,
  ) {
    return this.patientsService.findAll(tenantId, page, limit, search, status, department);
  }

  @Get('stats')
  @Scopes(Scope.PATIENTS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Get patient statistics' })
  getStats(@TenantId() tenantId: string) {
    return this.patientsService.getStats(tenantId);
  }

  @Get(':id')
  @Scopes(Scope.PATIENTS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Get a patient by ID' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.patientsService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Scopes(Scope.PATIENTS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.RECEPTIONIST, Role.DOCTOR, Role.NURSE)
  @ApiOperation({ summary: 'Update a patient' })
  update(
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.patientsService.update(id, updatePatientDto, req.user.userId, tenantId, req.user.username);
  }

  @Delete(':id')
  @Scopes(Scope.PATIENTS)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a patient' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser, @TenantId() tenantId: string) {
    return this.patientsService.remove(id, req.user.userId, tenantId);
  }
}
