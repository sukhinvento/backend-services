import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { CreateEmployeeSalaryDto } from './dto/create-employee-salary.dto';
import { UpdateEmployeeSalaryDto } from './dto/update-employee-salary.dto';
import { RunPayrollDto } from './dto/run-payroll.dto';
import { JwtAuthGuard } from '@auth/jwt-auth.guard';
import { RolesGuard, ScopesGuard } from '@common/guards';
import { Roles, Scopes, TenantId } from '@common/decorators';
import { Role, Scope } from '@common/enums';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';

@ApiTags('payroll')
@ApiBearerAuth('JWT-auth')
@Controller('payroll')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  // ── Employee salary configs ─────────────────────────────────────────────

  @Get('employees')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'List employee salary configurations' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Paginated list of salary configs' })
  findAllEmployees(
    @TenantId() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.payrollService.findAllEmployees(tenantId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    });
  }

  @Post('employees')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create an employee salary configuration' })
  @ApiResponse({ status: 201, description: 'Salary config created' })
  createEmployee(
    @Body() dto: CreateEmployeeSalaryDto,
    @TenantId() tenantId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.payrollService.createEmployee(dto, tenantId, req.user.userId);
  }

  @Patch('employees/:id')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update an employee salary configuration' })
  @ApiParam({ name: 'id', description: 'Employee salary config ID' })
  updateEmployee(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeSalaryDto,
    @TenantId() tenantId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.payrollService.updateEmployee(id, dto, tenantId, req.user.userId);
  }

  // ── Payroll runs ────────────────────────────────────────────────────────

  @Get('runs')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'List payroll runs (paginated)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Paginated list of payroll runs' })
  findAllRuns(
    @TenantId() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.payrollService.findAllRuns(tenantId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('run')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Generate payroll for a month' })
  @ApiResponse({ status: 201, description: 'Payroll run created in draft status' })
  @ApiResponse({ status: 400, description: 'Payroll for this period already exists' })
  runPayroll(
    @Body() dto: RunPayrollDto,
    @TenantId() tenantId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.payrollService.runPayroll(dto.payroll_period, tenantId, req.user.userId);
  }

  @Post('runs/:id/process')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Process payroll — creates journal entry (debit Salaries Expense, credit Salaries Payable)' })
  @ApiParam({ name: 'id', description: 'Payroll run ID' })
  @ApiResponse({ status: 200, description: 'Payroll processed and journal entry created' })
  @ApiResponse({ status: 400, description: 'Only draft payroll runs can be processed' })
  processPayroll(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.payrollService.processPayroll(id, tenantId, req.user.userId);
  }

  @Post('runs/:id/pay')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Pay payroll — marks as paid, debit Salaries Payable, credit Cash/Bank' })
  @ApiParam({ name: 'id', description: 'Payroll run ID' })
  @ApiResponse({ status: 200, description: 'Payroll paid' })
  @ApiResponse({ status: 400, description: 'Only processed payroll runs can be paid' })
  payPayroll(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.payrollService.payPayroll(id, tenantId, req.user.userId);
  }
}
