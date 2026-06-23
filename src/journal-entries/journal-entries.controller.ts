import {
  Controller,
  Get,
  Post,
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
import { JournalEntriesService } from './journal-entries.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { JwtAuthGuard } from '@auth/jwt-auth.guard';
import { RolesGuard, ScopesGuard } from '@common/guards';
import { Roles, Scopes, TenantId } from '@common/decorators';
import { Role, Scope } from '@common/enums';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';

@ApiTags('journal-entries')
@ApiBearerAuth('JWT-auth')
@Controller('journal-entries')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class JournalEntriesController {
  constructor(
    private readonly journalEntriesService: JournalEntriesService,
  ) {}

  @Get()
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'List journal entries — paginated with filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false, description: 'Search by entry_number, description, reference_number' })
  @ApiQuery({ name: 'status', required: false, description: 'draft | posted | reversed' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Start date YYYY-MM-DD' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'End date YYYY-MM-DD' })
  @ApiResponse({ status: 200, description: 'Paginated list of journal entries' })
  findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.journalEntriesService.findAll(tenantId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      status,
      dateFrom,
      dateTo,
    });
  }

  @Get(':id')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Get a single journal entry by ID' })
  @ApiParam({ name: 'id', description: 'Journal entry ID' })
  @ApiResponse({ status: 200, description: 'Journal entry details' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.journalEntriesService.findOne(id, tenantId);
  }

  @Post()
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Create a new journal entry (draft)' })
  @ApiResponse({ status: 201, description: 'Journal entry created' })
  @ApiResponse({ status: 400, description: 'Validation error — debits != credits' })
  create(
    @Body() dto: CreateJournalEntryDto,
    @TenantId() tenantId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.journalEntriesService.create(dto, tenantId, req.user.userId);
  }

  @Post(':id/post')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Post a draft journal entry to the ledger (updates account balances)' })
  @ApiParam({ name: 'id', description: 'Journal entry ID' })
  @ApiResponse({ status: 200, description: 'Entry posted — account balances updated' })
  @ApiResponse({ status: 400, description: 'Entry is not in draft status' })
  @ApiResponse({ status: 404, description: 'Not found' })
  post(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.journalEntriesService.post(id, tenantId, req.user.userId);
  }

  @Post(':id/reverse')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Reverse a posted journal entry (creates reversal entry, adjusts balances back)' })
  @ApiParam({ name: 'id', description: 'Journal entry ID' })
  @ApiResponse({ status: 200, description: 'Reversal entry created' })
  @ApiResponse({ status: 400, description: 'Entry is not in posted status' })
  @ApiResponse({ status: 404, description: 'Not found' })
  reverse(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.journalEntriesService.reverse(id, tenantId, req.user.userId);
  }

  @Delete(':id')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Delete a draft journal entry' })
  @ApiParam({ name: 'id', description: 'Journal entry ID' })
  @ApiResponse({ status: 200, description: 'Entry deleted' })
  @ApiResponse({ status: 400, description: 'Only draft entries can be deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.journalEntriesService.delete(id, tenantId);
  }
}
