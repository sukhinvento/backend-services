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
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AdmissionsService } from './admissions.service';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { UpdateAdmissionDto } from './dto/update-admission.dto';
import { JwtAuthGuard } from '@auth/jwt-auth.guard';
import { RolesGuard, ScopesGuard } from '@common/guards';
import { Roles, Scopes, TenantId } from '@common/decorators';
import { Role, Scope } from '@common/enums';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';
import { Room, RoomDocument } from '../rooms/schemas/room.schema';
import { Patient, PatientDocument } from '../patients/schemas/patient.schema';

@ApiTags('admissions')
@ApiBearerAuth('JWT-auth')
@Controller('admissions')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class AdmissionsController {
  constructor(
    private readonly admissionsService: AdmissionsService,
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
  ) {}

  @Post()
  @Scopes(Scope.ADMISSIONS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.RECEPTIONIST, Role.DOCTOR)
  @ApiOperation({ summary: 'Create a new admission' })
  create(
    @Body() createAdmissionDto: CreateAdmissionDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.admissionsService.create(
      createAdmissionDto,
      req.user.userId,
      tenantId,
      this.roomModel,
      this.patientModel,
      req.user.username,
    );
  }

  @Get()
  @Scopes(Scope.ADMISSIONS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Get all admissions' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'patient_id', required: false })
  @ApiQuery({ name: 'doctor_id', required: false })
  @ApiQuery({ name: 'room_id', required: false })
  findAll(
    @TenantId() tenantId: string,
    @Query('status') status?: string,
    @Query('patient_id') patient_id?: string,
    @Query('doctor_id') doctor_id?: string,
    @Query('room_id') room_id?: string,
  ) {
    return this.admissionsService.findAll(tenantId, status, patient_id, doctor_id, room_id);
  }

  @Get('active')
  @Scopes(Scope.ADMISSIONS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Get active admissions' })
  findActive(@TenantId() tenantId: string) {
    return this.admissionsService.findActive(tenantId);
  }

  @Get('analytics/monthly')
  @Scopes(Scope.ADMISSIONS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.VIEWER)
  @ApiOperation({ summary: 'Get monthly admissions and discharges for the last N months' })
  @ApiQuery({ name: 'months', required: false })
  getMonthlyAnalytics(@TenantId() tenantId: string, @Query('months') months?: string) {
    return this.admissionsService.getMonthlyAnalytics(tenantId, months ? parseInt(months, 10) : 12);
  }

  @Get(':id')
  @Scopes(Scope.ADMISSIONS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Get an admission by ID' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.admissionsService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Scopes(Scope.ADMISSIONS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.NURSE)
  @ApiOperation({ summary: 'Update an admission' })
  update(
    @Param('id') id: string,
    @Body() updateAdmissionDto: UpdateAdmissionDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.admissionsService.update(id, updateAdmissionDto, req.user.userId, tenantId, req.user.username);
  }

  @Post(':id/discharge')
  @Scopes(Scope.ADMISSIONS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.DOCTOR)
  @ApiOperation({ summary: 'Discharge a patient' })
  discharge(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.admissionsService.discharge(
      id,
      req.user.userId,
      tenantId,
      this.roomModel,
      this.patientModel,
      req.user.username,
    );
  }

  @Delete(':id')
  @Scopes(Scope.ADMISSIONS)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete an admission' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser, @TenantId() tenantId: string) {
    return this.admissionsService.remove(id, req.user.userId, tenantId);
  }
}
