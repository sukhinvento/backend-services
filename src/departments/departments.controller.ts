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
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { JwtAuthGuard } from '@auth/jwt-auth.guard';
import { RolesGuard, ScopesGuard } from '@common/guards';
import { Roles, Scopes, TenantId } from '@common/decorators';
import { Role, Scope } from '@common/enums';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';

@ApiTags('departments')
@ApiBearerAuth('JWT-auth')
@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  // ── POST /departments ──────────────────────────────────────────────────────
  @Post()
  @Scopes(Scope.DEPARTMENTS)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create a department' })
  create(
    @Body() dto: CreateDepartmentDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.departmentsService.create(dto, req.user.userId, tenantId);
  }

  // ── GET /departments ───────────────────────────────────────────────────────
  @Get()
  @Scopes(Scope.DEPARTMENTS)
  @Roles(
    Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER,
    Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.BILLING_STAFF,
  )
  @ApiOperation({ summary: 'List departments (paginated)' })
  @ApiQuery({ name: 'page',   required: false })
  @ApiQuery({ name: 'limit',  required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive'] })
  findAll(
    @TenantId() tenantId: string,
    @Query('page')   page?: number,
    @Query('limit')  limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.departmentsService.findAll(tenantId, { page, limit, search, status });
  }

  // ── GET /departments/names — lightweight dropdown list ─────────────────────
  @Get('names')
  @Scopes(Scope.DEPARTMENTS)
  @Roles(
    Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER,
    Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.BILLING_STAFF,
  )
  @ApiOperation({ summary: 'Get sorted list of active department names (for dropdowns)' })
  findActiveNames(@TenantId() tenantId: string) {
    return this.departmentsService.findActiveNames(tenantId);
  }

  // ── GET /departments/:id ───────────────────────────────────────────────────
  @Get(':id')
  @Scopes(Scope.DEPARTMENTS)
  @Roles(
    Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER,
    Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.BILLING_STAFF,
  )
  @ApiOperation({ summary: 'Get department by ID' })
  findOne(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.departmentsService.findOne(id, tenantId);
  }

  // ── PATCH /departments/:id ─────────────────────────────────────────────────
  @Patch(':id')
  @Scopes(Scope.DEPARTMENTS)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update a department' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.departmentsService.update(id, dto, req.user.userId, tenantId);
  }

  // ── DELETE /departments/:id ────────────────────────────────────────────────
  @Delete(':id')
  @Scopes(Scope.DEPARTMENTS)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a department' })
  remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.departmentsService.remove(id, req.user.userId, tenantId);
  }
}
