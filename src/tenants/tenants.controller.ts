import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CreateFieldConfigurationDto } from './dto/create-field-configuration.dto';
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
import { TenantResponseDto } from './dto/tenant-response.dto';
import { QueryDto } from '@common/dto/query.dto';

@ApiTags('tenants')
@ApiBearerAuth('JWT-auth')
@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @ApiOperation({
    summary: 'Create a new tenant',
    description: 'Creates a new tenant (Admin only)',
  })
  @ApiBody({ type: CreateTenantDto })
  @ApiResponse({
    status: 201,
    description: 'Tenant created successfully',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @Post()
  @Scopes(Scope.TENANTS)
  @Roles(Role.ADMIN)
  create(
    @Body() createTenantDto: CreateTenantDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return this.tenantsService.create(createTenantDto, userId);
  }

  @ApiOperation({
    summary: 'Get all tenants',
    description: 'Retrieves all tenants (Admin/Manager only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of tenants retrieved successfully',
    type: [TenantResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Manager role required',
  })
  @ApiQuery({ name: 'query', type: QueryDto })
  @Get()
  @Scopes(Scope.TENANTS)
  @Roles(Role.ADMIN, Role.MANAGER)
  findAll(@Query() query: Omit<QueryDto, 'filter'>) {
    const { page, limit, sort, ...filter } = query;
    return this.tenantsService.findAll({ page, limit, sort, filter });
  }

  @ApiOperation({
    summary: 'Get tenant by ID',
    description: 'Retrieves a specific tenant by ID (Admin/Manager only)',
  })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenant retrieved successfully',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Manager role required',
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @Get(':id')
  @Scopes(Scope.TENANTS)
  @Roles(Role.ADMIN, Role.MANAGER)
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @ApiOperation({
    summary: 'Update tenant',
    description: 'Updates a tenant (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiBody({ type: UpdateTenantDto })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @Patch(':id')
  @Scopes(Scope.TENANTS)
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return this.tenantsService.update(id, updateTenantDto, userId);
  }

  @ApiOperation({
    summary: 'Delete tenant',
    description: 'Deletes a tenant (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'Tenant deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @Delete(':id')
  @Scopes(Scope.TENANTS)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.tenantsService.remove(id, userId);
  }

  @ApiOperation({
    summary: 'Create field configuration',
    description:
      'Creates field configuration for a tenant module (Admin/Manager only)',
  })
  @ApiParam({ name: 'tenant', description: 'Tenant ID' })
  @ApiParam({ name: 'module', description: 'Module name' })
  @ApiBody({ type: CreateFieldConfigurationDto })
  @ApiResponse({
    status: 201,
    description: 'Field configuration created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Manager role required',
  })
  @Post(':tenant/config/:module/fields')
  @Scopes(Scope.TENANTS)
  @Roles(Role.ADMIN, Role.MANAGER)
  createFieldConfiguration(
    @Param('tenant') tenant: string,
    @Param('module') module: string,
    @Body() createFieldConfigurationDto: CreateFieldConfigurationDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return this.tenantsService.createFieldConfiguration(
      tenant,
      module,
      createFieldConfigurationDto,
      userId,
    );
  }

  @ApiOperation({
    summary: 'Get field configuration',
    description: 'Retrieves field configuration for a tenant module',
  })
  @ApiParam({ name: 'tenant', description: 'Tenant ID' })
  @ApiResponse({
    status: 200,
    description: 'Field configuration retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  @Get(':tenant/schema')
  @Scopes(Scope.TENANTS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  getFieldConfiguration(
    @Param('tenant') tenant: string,
    @Query('module') module: string,
  ) {
    return this.tenantsService.getFieldConfiguration(tenant, module);
  }
}
