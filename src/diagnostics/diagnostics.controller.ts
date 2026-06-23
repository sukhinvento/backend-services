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
import { DiagnosticsService } from './diagnostics.service';
import { CreateDiagnosticTestDto } from './dto/create-diagnostic-test.dto';
import { UpdateDiagnosticTestDto } from './dto/update-diagnostic-test.dto';
import { CreatePatientDiagnosticDto } from './dto/create-patient-diagnostic.dto';
import { UpdatePatientDiagnosticDto } from './dto/update-patient-diagnostic.dto';
import { JwtAuthGuard } from '@auth/jwt-auth.guard';
import { RolesGuard, ScopesGuard } from '@common/guards';
import { Roles, Scopes, TenantId } from '@common/decorators';
import { Role, Scope } from '@common/enums';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';

@ApiTags('diagnostics')
@ApiBearerAuth('JWT-auth')
@Controller('diagnostics')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class DiagnosticsController {
  constructor(private readonly diagnosticsService: DiagnosticsService) {}

  // --- Test Catalog ---

  @Post('tests')
  @Scopes(Scope.DIAGNOSTICS)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create a diagnostic test (catalog)' })
  createTest(
    @Body() dto: CreateDiagnosticTestDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.diagnosticsService.createTest(dto, req.user.userId, tenantId, req.user.username);
  }

  @Get('tests')
  @Scopes(Scope.DIAGNOSTICS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.NURSE, Role.LAB_TECHNICIAN, Role.RECEPTIONIST, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'List diagnostic tests catalog' })
  findAllTests(
    @TenantId() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.diagnosticsService.findAllTests(tenantId, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 25);
  }

  @Patch('tests/:id')
  @Scopes(Scope.DIAGNOSTICS)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update a diagnostic test' })
  updateTest(
    @Param('id') id: string,
    @Body() dto: UpdateDiagnosticTestDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.diagnosticsService.updateTest(id, dto, req.user.userId, tenantId, req.user.username);
  }

  @Delete('tests/:id')
  @Scopes(Scope.DIAGNOSTICS)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a diagnostic test' })
  removeTest(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.diagnosticsService.removeTest(id, req.user.userId, tenantId);
  }

  // --- Bookings ---

  @Post('bookings')
  @Scopes(Scope.DIAGNOSTICS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.NURSE)
  @ApiOperation({ summary: 'Create a diagnostic booking' })
  createBooking(
    @Body() dto: CreatePatientDiagnosticDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.diagnosticsService.createBooking(dto, req.user.userId, tenantId, req.user.username);
  }

  @Get('bookings')
  @Scopes(Scope.DIAGNOSTICS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.NURSE, Role.LAB_TECHNICIAN, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Get all diagnostic bookings' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'patient_id', required: false })
  @ApiQuery({ name: 'priority', required: false })
  findAllBookings(
    @TenantId() tenantId: string,
    @Query('status') status?: string,
    @Query('patient_id') patient_id?: string,
    @Query('priority') priority?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.diagnosticsService.findAllBookings(tenantId, status, patient_id, priority, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 25);
  }

  @Get('bookings/stats')
  @Scopes(Scope.DIAGNOSTICS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.NURSE, Role.LAB_TECHNICIAN, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Get diagnostic booking statistics' })
  getBookingStats(@TenantId() tenantId: string) {
    return this.diagnosticsService.getBookingStats(tenantId);
  }

  @Get('bookings/analytics/monthly-category')
  @Scopes(Scope.DIAGNOSTICS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.VIEWER)
  @ApiOperation({ summary: 'Get monthly diagnostic bookings by category' })
  @ApiQuery({ name: 'months', required: false })
  getMonthlyCategoryAnalytics(@TenantId() tenantId: string, @Query('months') months?: string) {
    return this.diagnosticsService.getMonthlyCategoryAnalytics(tenantId, months ? parseInt(months, 10) : 6);
  }

  @Get('bookings/:id')
  @Scopes(Scope.DIAGNOSTICS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.NURSE, Role.LAB_TECHNICIAN, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Get a diagnostic booking by ID' })
  findOneBooking(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.diagnosticsService.findOneBooking(id, tenantId);
  }

  @Patch('bookings/:id')
  @Scopes(Scope.DIAGNOSTICS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Update a diagnostic booking' })
  updateBooking(
    @Param('id') id: string,
    @Body() dto: UpdatePatientDiagnosticDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.diagnosticsService.updateBooking(id, dto, req.user.userId, tenantId, req.user.username);
  }

  @Delete('bookings/:id')
  @Scopes(Scope.DIAGNOSTICS)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a diagnostic booking' })
  removeBooking(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.diagnosticsService.removeBooking(id, req.user.userId, tenantId);
  }
}
