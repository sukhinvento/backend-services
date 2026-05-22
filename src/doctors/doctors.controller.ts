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
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { JwtAuthGuard } from '@auth/jwt-auth.guard';
import { RolesGuard, ScopesGuard } from '@common/guards';
import { Roles, Scopes, TenantId } from '@common/decorators';
import { Role, Scope } from '@common/enums';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';

@ApiTags('doctors')
@ApiBearerAuth('JWT-auth')
@Controller('doctors')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @Scopes(Scope.DOCTORS)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create a new doctor' })
  create(
    @Body() createDoctorDto: CreateDoctorDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.doctorsService.create(createDoctorDto, req.user.userId, tenantId);
  }

  @Get()
  @Scopes(Scope.DOCTORS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Get all doctors' })
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
    return this.doctorsService.findAll(tenantId, page, limit, search, status, department);
  }

  @Get('stats')
  @Scopes(Scope.DOCTORS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Get doctor statistics' })
  getStats(@TenantId() tenantId: string) {
    return this.doctorsService.getStats(tenantId);
  }

  @Get(':id')
  @Scopes(Scope.DOCTORS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Get a doctor by ID' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.doctorsService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Scopes(Scope.DOCTORS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.DOCTOR)
  @ApiOperation({ summary: 'Update a doctor' })
  update(
    @Param('id') id: string,
    @Body() updateDoctorDto: UpdateDoctorDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.doctorsService.update(id, updateDoctorDto, req.user.userId, tenantId);
  }

  @Delete(':id')
  @Scopes(Scope.DOCTORS)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a doctor' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser, @TenantId() tenantId: string) {
    return this.doctorsService.remove(id, req.user.userId, tenantId);
  }
}
