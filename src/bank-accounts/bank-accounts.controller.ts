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
import { BankAccountsService } from './bank-accounts.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { CreateBankTransactionDto } from './dto/create-bank-transaction.dto';
import { JwtAuthGuard } from '@auth/jwt-auth.guard';
import { RolesGuard, ScopesGuard } from '@common/guards';
import { Roles, Scopes, TenantId } from '@common/decorators';
import { Role, Scope } from '@common/enums';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';

@ApiTags('bank-accounts')
@ApiBearerAuth('JWT-auth')
@Controller('bank-accounts')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  // ── Bank account CRUD ───────────────────────────────────────────────────

  @Get()
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'List bank accounts' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Paginated list of bank accounts' })
  findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.bankAccountsService.findAll(tenantId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    });
  }

  @Get(':id')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Get a bank account by ID' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.bankAccountsService.findOne(id, tenantId);
  }

  @Post()
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create a bank account' })
  @ApiResponse({ status: 201, description: 'Bank account created' })
  create(
    @Body() dto: CreateBankAccountDto,
    @TenantId() tenantId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.bankAccountsService.create(dto, tenantId, req.user.userId);
  }

  @Patch(':id')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update a bank account' })
  @ApiParam({ name: 'id' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBankAccountDto,
    @TenantId() tenantId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.bankAccountsService.update(id, dto, tenantId, req.user.userId);
  }

  // ── Transactions ────────────────────────────────────────────────────────

  @Get(':id/transactions')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'List transactions for a bank account (paginated)' })
  @ApiParam({ name: 'id', description: 'Bank account ID' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getTransactions(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bankAccountsService.getTransactions(id, tenantId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post(':id/transactions')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Create a bank transaction' })
  @ApiParam({ name: 'id', description: 'Bank account ID' })
  @ApiResponse({ status: 201, description: 'Transaction created, bank balance updated' })
  createTransaction(
    @Param('id') id: string,
    @Body() dto: CreateBankTransactionDto,
    @TenantId() tenantId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.bankAccountsService.createTransaction(id, dto, tenantId, req.user.userId);
  }

  @Post(':id/transactions/:txnId/reconcile')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Reconcile a bank transaction' })
  @ApiParam({ name: 'id', description: 'Bank account ID' })
  @ApiParam({ name: 'txnId', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Transaction marked as reconciled' })
  reconcile(
    @Param('id') id: string,
    @Param('txnId') txnId: string,
    @TenantId() tenantId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.bankAccountsService.reconcileTransaction(id, txnId, tenantId, req.user.userId);
  }
}
