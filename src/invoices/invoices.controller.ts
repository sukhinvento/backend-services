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
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';
import { JwtAuthGuard } from '@auth/jwt-auth.guard';
import { RolesGuard, ScopesGuard } from '@common/guards';
import { Roles, Scopes, TenantId } from '@common/decorators';
import { Role, Scope } from '@common/enums';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { QueryDto } from '@common/dto/query.dto';

@ApiTags('invoices')
@ApiBearerAuth('JWT-auth')
@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Scopes(Scope.INVOICES)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  create(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    const username = req.user.username;
    const tenantId = req.user.tenantId;
    return this.invoicesService.create(createInvoiceDto, userId, tenantId, username);
  }

  @Get()
  @Scopes(Scope.INVOICES)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.USER)
  @ApiQuery({ name: 'query', type: QueryDto })
  findAll(@Query() query: Omit<QueryDto, 'filter'>) {
    const { page, limit, sort, ...filter } = query;
    return this.invoicesService.findAll({ page, limit, sort, filter });
  }

  @Get('analytics/weekly')
  @Scopes(Scope.INVOICES)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  @ApiOperation({ summary: 'Get weekly invoice collection trend' })
  @ApiQuery({ name: 'weeks', required: false })
  getWeeklyAnalytics(@TenantId() tenantId: string, @Query('weeks') weeks?: string) {
    return this.invoicesService.getWeeklyAnalytics(tenantId, weeks ? parseInt(weeks, 10) : 12);
  }

  @Get('analytics/monthly')
  @Scopes(Scope.INVOICES)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  @ApiOperation({ summary: 'Get monthly revenue trend (SO + diagnostics + admissions)' })
  @ApiQuery({ name: 'months', required: false })
  getMonthlyAnalytics(@TenantId() tenantId: string, @Query('months') months?: string) {
    return this.invoicesService.getMonthlyAnalytics(tenantId, months ? parseInt(months, 10) : 12);
  }

  @Get('analytics/expenditure/monthly')
  @Scopes(Scope.INVOICES)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  @ApiOperation({ summary: 'Get monthly expenditure trend (purchase orders only)' })
  @ApiQuery({ name: 'months', required: false })
  getMonthlyExpenditureAnalytics(@TenantId() tenantId: string, @Query('months') months?: string) {
    return this.invoicesService.getMonthlyExpenditureAnalytics(tenantId, months ? parseInt(months, 10) : 12);
  }

  @Get(':id')
  @Scopes(Scope.INVOICES)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.USER)
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id')
  @Scopes(Scope.INVOICES)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    const username = req.user.username;
    return this.invoicesService.update(id, updateInvoiceDto, userId, username);
  }

  @Delete(':id')
  @Scopes(Scope.INVOICES)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.invoicesService.remove(id, userId);
  }

  @Post(':id/pay')
  @Scopes(Scope.INVOICES)
  @Roles(Role.ADMIN, Role.USER)
  pay(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    const username = req.user.username;
    return this.invoicesService.pay(id, userId, username);
  }
}
