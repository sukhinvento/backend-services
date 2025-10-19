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
  Put,
} from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';
import { JwtAuthGuard } from '@auth/jwt-auth.guard';
import { RolesGuard, ScopesGuard } from '@common/guards';
import { Roles, Scopes } from '@common/decorators';
import { Role, Scope } from '@common/enums';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { QuotationResponseDto } from './dto/quotation-response.dto';
import { QueryDto } from '@common/dto/query.dto';

@ApiTags('quotations')
@ApiBearerAuth('JWT-auth')
@Controller('quotations')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @ApiOperation({
    summary: 'Create a new quotation',
    description: 'Creates a new quotation (Admin/Manager only)',
  })
  @ApiBody({ type: CreateQuotationDto })
  @ApiResponse({
    status: 201,
    description: 'Quotation created successfully',
    type: QuotationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Manager role required',
  })
  @Post()
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER)
  create(
    @Body() createQuotationDto: CreateQuotationDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return this.quotationsService.create(createQuotationDto, userId);
  }

  @ApiOperation({
    summary: 'Get all quotations',
    description: 'Retrieves all quotations',
  })
  @ApiResponse({
    status: 200,
    description: 'List of quotations retrieved successfully',
    type: [QuotationResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiQuery({ name: 'query', type: QueryDto })
  @Get()
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  findAll(@Query() query: Omit<QueryDto, 'filter'>) {
    const { page, limit, sort, ...filter } = query;
    return this.quotationsService.findAll({ page, limit, sort, filter });
  }

  @ApiOperation({
    summary: 'Get quotation by ID',
    description: 'Retrieves a specific quotation by ID',
  })
  @ApiParam({ name: 'id', description: 'Quotation ID' })
  @ApiResponse({
    status: 200,
    description: 'Quotation retrieved successfully',
    type: QuotationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Quotation not found' })
  @Get(':id')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  findOne(@Param('id') id: string) {
    return this.quotationsService.findOne(id);
  }

  @ApiOperation({
    summary: 'Update quotation',
    description: 'Updates a quotation by ID (Admin/Manager only)',
  })
  @ApiParam({ name: 'id', description: 'Quotation ID' })
  @ApiBody({ type: UpdateQuotationDto })
  @ApiResponse({
    status: 200,
    description: 'Quotation updated successfully',
    type: QuotationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Quotation not found' })
  @Patch(':id')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateQuotationDto: UpdateQuotationDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return this.quotationsService.update(id, updateQuotationDto, userId);
  }

  @ApiOperation({
    summary: 'Delete quotation',
    description: 'Deletes a quotation by ID (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Quotation ID' })
  @ApiResponse({ status: 200, description: 'Quotation deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Quotation not found' })
  @Delete(':id')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.quotationsService.remove(id, userId);
  }

  @ApiOperation({
    summary: 'Approve quotation',
    description: 'Approves a quotation (Admin/Manager only)',
  })
  @ApiParam({ name: 'id', description: 'Quotation ID' })
  @ApiResponse({
    status: 200,
    description: 'Quotation approved successfully',
    type: QuotationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Quotation not found' })
  @Put(':id/approve')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER)
  approve(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.quotationsService.approve(id, userId);
  }

  @ApiOperation({
    summary: 'Reject quotation',
    description: 'Rejects a quotation (Admin/Manager only)',
  })
  @ApiParam({ name: 'id', description: 'Quotation ID' })
  @ApiResponse({
    status: 200,
    description: 'Quotation rejected successfully',
    type: QuotationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Quotation not found' })
  @Put(':id/reject')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER)
  reject(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.quotationsService.reject(id, userId);
  }

  @ApiOperation({
    summary: 'Amend quotation',
    description: 'Amends a quotation (Admin/Manager only)',
  })
  @ApiParam({ name: 'id', description: 'Quotation ID' })
  @ApiBody({ type: UpdateQuotationDto })
  @ApiResponse({
    status: 200,
    description: 'Quotation amended successfully',
    type: QuotationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Quotation not found' })
  @Put(':id/amend')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER)
  amend(
    @Param('id') id: string,
    @Body() updateQuotationDto: UpdateQuotationDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return this.quotationsService.amend(id, updateQuotationDto, userId);
  }
}
