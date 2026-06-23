import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JwtAuthGuard } from '@auth/jwt-auth.guard';
import { RolesGuard, ScopesGuard } from '@common/guards';
import { Roles, Scopes, TenantId } from '@common/decorators';
import { Role, Scope } from '@common/enums';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';

@ApiTags('accounts')
@ApiBearerAuth('JWT-auth')
@Controller('accounts')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  // ── CRUD ────────────────────────────────────────────────────────────────

  @Get()
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF, Role.VIEWER)
  @ApiOperation({ summary: 'Get all accounts (Chart of Accounts) — paginated' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default 25, max 25)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by account name or code' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by account_type (asset, liability, equity, revenue, expense)' })
  @ApiQuery({ name: 'is_active', required: false, description: 'Filter by active status' })
  @ApiResponse({ status: 200, description: 'Paginated list of accounts' })
  findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('is_active') is_active?: string,
  ) {
    return this.accountsService.findAll(tenantId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      type,
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
    });
  }

  @Get('stats')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF, Role.VIEWER)
  @ApiOperation({ summary: 'Get account counts grouped by type' })
  @ApiResponse({ status: 200, description: 'Account stats by type' })
  getStats(@TenantId() tenantId: string) {
    return this.accountsService.getStats(tenantId);
  }

  @Get(':id')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF, Role.VIEWER)
  @ApiOperation({ summary: 'Get a single account by ID' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Account details' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.accountsService.findOne(id, tenantId);
  }

  @Post()
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request — duplicate code or validation error' })
  create(
    @Body() createAccountDto: CreateAccountDto,
    @TenantId() tenantId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.accountsService.create(createAccountDto, tenantId, req.user.userId);
  }

  @Patch(':id')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update an account' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Account updated successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  update(
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
    @TenantId() tenantId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.accountsService.update(id, updateAccountDto, tenantId, req.user.userId);
  }

  @Delete(':id')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Soft-delete an account (set is_active = false)' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Account deactivated' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  remove(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.accountsService.delete(id, tenantId, req.user.userId);
  }

  // ── Financial statements ────────────────────────────────────────────────

  @Get('reports/balance-sheet')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF, Role.VIEWER)
  @ApiOperation({ summary: 'Get Balance Sheet (Assets / Liabilities / Equity)' })
  getBalanceSheet(@TenantId() tenantId: string) {
    return this.accountsService.getBalanceSheet(tenantId);
  }

  @Get('reports/profit-loss')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF, Role.VIEWER)
  @ApiOperation({ summary: 'Get Profit & Loss statement for a period' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: false, description: 'End date YYYY-MM-DD' })
  getProfitAndLoss(
    @TenantId() tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.accountsService.getProfitAndLoss(tenantId, from, to);
  }

  @Get('reports/aging')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF, Role.VIEWER)
  @ApiOperation({ summary: 'Get AR/AP Aging report' })
  @ApiQuery({ name: 'type', required: true, description: 'AR or AP' })
  @ApiQuery({ name: 'as_of', required: false, description: 'As-of date YYYY-MM-DD (defaults to today)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (max 25)' })
  getAgingReport(
    @TenantId() tenantId: string,
    @Query('type') type: string,
    @Query('as_of') asOf?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.accountsService.getAgingReport(tenantId, {
      type: type as 'AR' | 'AP',
      asOf: asOf || new Date().toISOString().split('T')[0],
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? Math.min(parseInt(limit, 10), 25) : 25,
    });
  }
}
