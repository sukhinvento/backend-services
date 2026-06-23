import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { OpdVisitsService } from './opd-visits.service';
import { CreateOpdVisitDto } from './dto/create-opd-visit.dto';
import { UpdateOpdVisitDto, UpdateOpdVisitStatusDto } from './dto/update-opd-visit.dto';
import { JwtAuthGuard } from '@auth/jwt-auth.guard';
import { RolesGuard, ScopesGuard } from '@common/guards';
import { Roles, Scopes, TenantId } from '@common/decorators';
import { Role, Scope } from '@common/enums';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';

@ApiTags('opd-visits')
@ApiBearerAuth('JWT-auth')
@Controller('opd-visits')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class OpdVisitsController {
  constructor(private readonly opdVisitsService: OpdVisitsService) {}

  @Post()
  @Scopes(Scope.PATIENTS)
  @ApiOperation({ summary: 'Register a new OPD visit (returns token)' })
  create(
    @Body() dto: CreateOpdVisitDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.opdVisitsService.create(dto, req.user.userId, tenantId, req.user.username);
  }

  @Get()
  @Scopes(Scope.PATIENTS)
  @ApiOperation({ summary: 'List OPD visits (paginated, filterable)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'department', required: false })
  @ApiQuery({ name: 'doctor_id', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('date') date?: string,
    @Query('department') department?: string,
    @Query('doctor_id') doctor_id?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.opdVisitsService.findAll(tenantId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
      date, department, doctor_id, status, search,
    });
  }

  @Get('today')
  @Scopes(Scope.PATIENTS)
  @ApiOperation({ summary: "Get today's OPD queue (optionally filtered by department)" })
  @ApiQuery({ name: 'department', required: false })
  getTodayQueue(
    @TenantId() tenantId: string,
    @Query('department') department?: string,
  ) {
    return this.opdVisitsService.findTodayQueue(tenantId, department);
  }

  @Get('stats')
  @Scopes(Scope.PATIENTS)
  @ApiOperation({ summary: "Get today's OPD statistics" })
  getStats(@TenantId() tenantId: string) {
    return this.opdVisitsService.getStats(tenantId);
  }

  @Get(':id')
  @Scopes(Scope.PATIENTS)
  @ApiOperation({ summary: 'Get a single OPD visit by ID' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.opdVisitsService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Scopes(Scope.PATIENTS)
  @ApiOperation({ summary: 'Update an OPD visit (notes, vitals, etc.)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOpdVisitDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.opdVisitsService.update(id, dto, req.user.userId, tenantId, req.user.username);
  }

  @Patch(':id/status')
  @Scopes(Scope.PATIENTS)
  @ApiOperation({ summary: 'Quick status change (waiting → in_consultation → completed)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOpdVisitStatusDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.opdVisitsService.updateStatus(id, dto, req.user.userId, tenantId, req.user.username);
  }

  @Delete(':id')
  @Scopes(Scope.PATIENTS)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Delete/cancel an OPD visit' })
  remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.opdVisitsService.remove(id, req.user.userId, tenantId);
  }
}
