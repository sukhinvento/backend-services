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
import { MedicationsService } from './medications.service';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { CreatePatientMedicationDto } from './dto/create-patient-medication.dto';
import { UpdatePatientMedicationDto } from './dto/update-patient-medication.dto';
import { JwtAuthGuard } from '@auth/jwt-auth.guard';
import { RolesGuard, ScopesGuard } from '@common/guards';
import { Roles, Scopes, TenantId } from '@common/decorators';
import { Role, Scope } from '@common/enums';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';

@ApiTags('medications')
@ApiBearerAuth('JWT-auth')
@Controller('medications')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  // --- Catalog ---

  @Post('catalog')
  @Scopes(Scope.MEDICATIONS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.PHARMACIST)
  @ApiOperation({ summary: 'Create a medication (catalog)' })
  createMedication(
    @Body() dto: CreateMedicationDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.medicationsService.createMedication(dto, req.user.userId, tenantId);
  }

  @Get('catalog')
  @Scopes(Scope.MEDICATIONS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.NURSE, Role.PHARMACIST, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'List medication catalog' })
  findAllMedications(@TenantId() tenantId: string) {
    return this.medicationsService.findAllMedications(tenantId);
  }

  @Get('catalog/:id')
  @Scopes(Scope.MEDICATIONS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.NURSE, Role.PHARMACIST, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Get a medication by ID' })
  findOneMedication(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.medicationsService.findOneMedication(id, tenantId);
  }

  @Patch('catalog/:id')
  @Scopes(Scope.MEDICATIONS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.PHARMACIST)
  @ApiOperation({ summary: 'Update a medication' })
  updateMedication(
    @Param('id') id: string,
    @Body() dto: UpdateMedicationDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.medicationsService.updateMedication(id, dto, req.user.userId, tenantId);
  }

  @Delete('catalog/:id')
  @Scopes(Scope.MEDICATIONS)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a medication' })
  removeMedication(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.medicationsService.removeMedication(id, req.user.userId, tenantId);
  }

  // --- Prescriptions ---

  @Post('prescriptions')
  @Scopes(Scope.MEDICATIONS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.DOCTOR)
  @ApiOperation({ summary: 'Create a prescription' })
  createPrescription(
    @Body() dto: CreatePatientMedicationDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.medicationsService.createPrescription(dto, req.user.userId, tenantId);
  }

  @Get('prescriptions')
  @Scopes(Scope.MEDICATIONS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.NURSE, Role.PHARMACIST, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Get all prescriptions' })
  @ApiQuery({ name: 'patient_id', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAllPrescriptions(
    @TenantId() tenantId: string,
    @Query('patient_id') patient_id?: string,
    @Query('status') status?: string,
  ) {
    return this.medicationsService.findAllPrescriptions(tenantId, patient_id, status);
  }

  @Get('prescriptions/:id')
  @Scopes(Scope.MEDICATIONS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.NURSE, Role.PHARMACIST, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Get a prescription by ID' })
  findOnePrescription(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.medicationsService.findOnePrescription(id, tenantId);
  }

  @Patch('prescriptions/:id')
  @Scopes(Scope.MEDICATIONS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.PHARMACIST)
  @ApiOperation({ summary: 'Update a prescription' })
  updatePrescription(
    @Param('id') id: string,
    @Body() dto: UpdatePatientMedicationDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.medicationsService.updatePrescription(id, dto, req.user.userId, tenantId);
  }

  @Delete('prescriptions/:id')
  @Scopes(Scope.MEDICATIONS)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a prescription' })
  removePrescription(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.medicationsService.removePrescription(id, req.user.userId, tenantId);
  }
}
