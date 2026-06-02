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
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';
import { JwtAuthGuard } from '@auth/jwt-auth.guard';
import { RolesGuard, ScopesGuard } from '@common/guards';
import { Roles, Scopes, TenantId } from '@common/decorators';
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
import { VendorResponseDto } from './dto/vendor-response.dto';
import { QueryDto } from '@common/dto/query.dto';

@ApiTags('vendors')
@ApiBearerAuth('JWT-auth')
@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @ApiOperation({
    summary: 'Create a new vendor',
    description: 'Creates a new vendor (Admin/Manager only)',
  })
  @ApiBody({ type: CreateVendorDto })
  @ApiResponse({
    status: 201,
    description: 'Vendor created successfully',
    type: VendorResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Manager role required',
  })
  @Post()
  @Scopes(Scope.VENDORS)
  @Roles(Role.ADMIN, Role.MANAGER)
  create(
    @Body() createVendorDto: CreateVendorDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    const userId = req.user.userId;
    const username = req.user.username;
    return this.vendorsService.create(createVendorDto, userId, tenantId, username);
  }

  @ApiOperation({
    summary: 'Get all vendors',
    description: 'Retrieves all vendors',
  })
  @ApiResponse({
    status: 200,
    description: 'List of vendors retrieved successfully',
    type: [VendorResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiQuery({ name: 'query', type: QueryDto })
  @Get()
  @Scopes(Scope.VENDORS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  findAll(@Query() query: QueryDto, @TenantId() tenantId: string) {
    const { page, limit, sort, filter } = query;
    // If filter is a string (JSON), parse it
    let parsedFilter = filter;
    if (typeof filter === 'string') {
      try {
        parsedFilter = JSON.parse(filter);
      } catch (e) {
        // If parsing fails, treat as empty filter
        parsedFilter = {};
      }
    }
    return this.vendorsService.findAll({ page, limit, sort, filter: parsedFilter || {} }, tenantId);
  }

  @ApiOperation({
    summary: 'Search vendors by term',
    description: 'Search vendors by name, code, or other fields',
  })
  @ApiQuery({ name: 'q', description: 'Search term', required: true })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
    type: [VendorResponseDto],
  })
  @Get('search')
  @Scopes(Scope.VENDORS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  searchVendors(
    @Query('q') searchTerm: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @TenantId() tenantId: string,
  ) {
    return this.vendorsService.searchVendors(searchTerm, tenantId, page, limit);
  }

  @ApiOperation({
    summary: 'Get vendors by tax slab',
    description: 'Get vendors that support a specific tax slab',
  })
  @ApiParam({ name: 'taxSlab', description: 'Tax slab identifier' })
  @ApiResponse({
    status: 200,
    description: 'Vendors retrieved successfully',
    type: [VendorResponseDto],
  })
  @Get('by-tax-slab/:taxSlab')
  @Scopes(Scope.VENDORS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  getVendorsByTaxSlab(
    @Param('taxSlab') taxSlab: string,
    @TenantId() tenantId: string,
  ) {
    return this.vendorsService.getVendorsByTaxSlab(taxSlab, tenantId);
  }

  @ApiOperation({
    summary: 'Get vendors by maximum lead time',
    description: 'Get vendors with lead time less than or equal to specified days',
  })
  @ApiParam({ name: 'maxLeadTime', description: 'Maximum lead time in days' })
  @ApiResponse({
    status: 200,
    description: 'Vendors retrieved successfully',
    type: [VendorResponseDto],
  })
  @Get('by-lead-time/:maxLeadTime')
  @Scopes(Scope.VENDORS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  getVendorsByLeadTime(
    @Param('maxLeadTime') maxLeadTime: number,
    @TenantId() tenantId: string,
  ) {
    return this.vendorsService.getVendorsByLeadTime(maxLeadTime, tenantId);
  }

  @ApiOperation({
    summary: 'Get available filter fields',
    description: 'Get list of available fields for filtering vendors',
  })
  @ApiResponse({
    status: 200,
    description: 'Filter fields retrieved successfully',
  })
  @Get('filter-fields')
  @Scopes(Scope.VENDORS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  getAvailableFilterFields() {
    return this.vendorsService.getAvailableFilterFields();
  }

  @ApiOperation({
    summary: 'Get vendor by ID',
    description: 'Retrieves a specific vendor by ID',
  })
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  @ApiResponse({
    status: 200,
    description: 'Vendor retrieved successfully',
    type: VendorResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  @Get(':id')
  @Scopes(Scope.VENDORS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.vendorsService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Scopes(Scope.VENDORS)
  @Roles(Role.ADMIN, Role.MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateVendorDto: UpdateVendorDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    const userId = req.user.userId;
    const username = req.user.username;
    return this.vendorsService.update(id, updateVendorDto, userId, tenantId, username);
  }

  @Delete(':id')
  @Scopes(Scope.VENDORS)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @Req() req: RequestWithUser, @TenantId() tenantId: string) {
    const userId = req.user.userId;
    return this.vendorsService.remove(id, userId, tenantId);
  }
}
