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
import { TaxService } from './tax.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
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
import { TaxResponseDto } from './dto/tax-response.dto';
import { QueryDto } from '@common/dto/query.dto';

@ApiTags('taxes')
@ApiBearerAuth('JWT-auth')
@Controller('taxes')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @ApiOperation({
    summary: 'Create a new tax',
    description: 'Creates a new tax configuration (Admin/Manager only)',
  })
  @ApiBody({ type: CreateTaxDto })
  @ApiResponse({
    status: 201,
    description: 'Tax created successfully',
    type: TaxResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Manager role required',
  })
  @Post()
  @Scopes(Scope.VENDORS) // Using VENDORS scope as tax is related to vendor operations
  @Roles(Role.ADMIN, Role.MANAGER)
  create(
    @Body() createTaxDto: CreateTaxDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return this.taxService.create(createTaxDto, userId);
  }

  @ApiOperation({
    summary: 'Get all taxes',
    description: 'Retrieves all tax configurations',
  })
  @ApiResponse({
    status: 200,
    description: 'List of taxes retrieved successfully',
    type: [TaxResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiQuery({ name: 'query', type: QueryDto, required: false })
  @Get()
  @Scopes(Scope.VENDORS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  findAll(@Query() query: Omit<QueryDto, 'filter'>) {
    const { page, limit, sort, ...filter } = query;
    return this.taxService.findAll({ page, limit, sort, filter });
  }

  @ApiOperation({
    summary: 'Get tax by ID',
    description: 'Retrieves a specific tax by ID',
  })
  @ApiParam({ name: 'id', description: 'Tax ID' })
  @ApiResponse({
    status: 200,
    description: 'Tax retrieved successfully',
    type: TaxResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Tax not found' })
  @Get(':id')
  @Scopes(Scope.VENDORS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  findOne(@Param('id') id: string) {
    return this.taxService.findOne(id);
  }

  @ApiOperation({
    summary: 'Get tax by code',
    description: 'Retrieves a specific tax by tax code',
  })
  @ApiParam({ name: 'code', description: 'Tax code' })
  @ApiResponse({
    status: 200,
    description: 'Tax retrieved successfully',
    type: TaxResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Tax not found' })
  @Get('code/:code')
  @Scopes(Scope.VENDORS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  findByCode(@Param('code') code: string) {
    return this.taxService.findByCode(code);
  }

  @ApiOperation({
    summary: 'Get taxes by IDs',
    description: 'Retrieves multiple active taxes by their IDs',
  })
  @ApiQuery({ name: 'ids', required: true, description: 'Comma-separated tax IDs' })
  @ApiResponse({
    status: 200,
    description: 'Taxes retrieved successfully',
    type: [TaxResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('by-ids')
  @Scopes(Scope.VENDORS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  findByIds(@Query('ids') ids: string) {
    const taxIdArray = ids.split(',').map(id => id.trim());
    return this.taxService.findByIds(taxIdArray);
  }

  @ApiOperation({
    summary: 'Get active taxes',
    description: 'Retrieves all active taxes, optionally filtered by applicableOn',
  })
  @ApiQuery({ name: 'applicableOn', required: false, enum: ['sales', 'purchase', 'both'], description: 'Filter by applicable on' })
  @ApiResponse({
    status: 200,
    description: 'Active taxes retrieved successfully',
    type: [TaxResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('active/list')
  @Scopes(Scope.VENDORS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  findActiveTaxes(@Query('applicableOn') applicableOn?: 'sales' | 'purchase' | 'both') {
    return this.taxService.findActiveTaxes(applicableOn);
  }

  @ApiOperation({
    summary: 'Calculate tax',
    description: 'Calculates tax amounts for a given subtotal and tax IDs',
  })
  @ApiQuery({ name: 'amount', required: true, description: 'Subtotal amount' })
  @ApiQuery({ name: 'taxIds', required: true, description: 'Comma-separated tax IDs' })
  @ApiResponse({
    status: 200,
    description: 'Tax calculation completed',
    schema: {
      properties: {
        subtotal: { type: 'number' },
        taxes: {
          type: 'array',
          items: {
            properties: {
              taxId: { type: 'string' },
              taxName: { type: 'string' },
              rate: { type: 'number' },
              amount: { type: 'number' },
            },
          },
        },
        total: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('calculate/amount')
  @Scopes(Scope.VENDORS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  calculateTax(
    @Query('amount') amount: string,
    @Query('taxIds') taxIds: string,
  ) {
    const taxIdArray = taxIds.split(',').map(id => id.trim());
    return this.taxService.calculateTax(parseFloat(amount), taxIdArray);
  }

  @ApiOperation({
    summary: 'Update a tax',
    description: 'Updates a tax configuration (Admin/Manager only)',
  })
  @ApiParam({ name: 'id', description: 'Tax ID' })
  @ApiBody({ type: UpdateTaxDto })
  @ApiResponse({
    status: 200,
    description: 'Tax updated successfully',
    type: TaxResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Manager role required',
  })
  @ApiResponse({ status: 404, description: 'Tax not found' })
  @Patch(':id')
  @Scopes(Scope.VENDORS)
  @Roles(Role.ADMIN, Role.MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateTaxDto: UpdateTaxDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return this.taxService.update(id, updateTaxDto, userId);
  }

  @ApiOperation({
    summary: 'Archive a tax',
    description: 'Archives a tax configuration (Admin/Manager only)',
  })
  @ApiParam({ name: 'id', description: 'Tax ID' })
  @ApiResponse({
    status: 200,
    description: 'Tax archived successfully',
    type: TaxResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Manager role required',
  })
  @ApiResponse({ status: 404, description: 'Tax not found' })
  @Patch(':id/archive')
  @Scopes(Scope.VENDORS)
  @Roles(Role.ADMIN, Role.MANAGER)
  archive(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.taxService.archive(id, userId);
  }

  @ApiOperation({
    summary: 'Activate a tax',
    description: 'Activates an archived tax configuration (Admin/Manager only)',
  })
  @ApiParam({ name: 'id', description: 'Tax ID' })
  @ApiResponse({
    status: 200,
    description: 'Tax activated successfully',
    type: TaxResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Manager role required',
  })
  @ApiResponse({ status: 404, description: 'Tax not found' })
  @Patch(':id/activate')
  @Scopes(Scope.VENDORS)
  @Roles(Role.ADMIN, Role.MANAGER)
  activate(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.taxService.activate(id, userId);
  }

  @ApiOperation({
    summary: 'Delete a tax',
    description: 'Deletes a tax configuration (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Tax ID' })
  @ApiResponse({
    status: 200,
    description: 'Tax deleted successfully',
    schema: {
      properties: {
        id: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @ApiResponse({ status: 404, description: 'Tax not found' })
  @Delete(':id')
  @Scopes(Scope.VENDORS)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.taxService.remove(id, userId);
  }
}

