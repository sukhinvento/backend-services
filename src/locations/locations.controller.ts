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
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
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
  ApiQuery,
} from '@nestjs/swagger';
import { QueryDto } from '@common/dto/query.dto';

@ApiTags('locations')
@ApiBearerAuth('JWT-auth')
@Controller('locations')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @ApiOperation({ summary: 'Create a new location' })
  @ApiResponse({ status: 201, description: 'Location created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Scopes(Scope.LOCATIONS)
  @Roles(Role.ADMIN, Role.MANAGER)
  create(
    @Body() dto: CreateLocationDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.locationsService.create(dto, req.user.userId, tenantId, req.user.username);
  }

  @ApiOperation({ summary: 'Get all locations' })
  @ApiResponse({ status: 200, description: 'List of locations' })
  @Get()
  @Scopes(Scope.LOCATIONS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  findAll(@Query() query: QueryDto, @TenantId() tenantId: string) {
    const { page, limit, sort, filter } = query;
    let parsedFilter = filter;
    if (typeof filter === 'string') {
      try {
        parsedFilter = JSON.parse(filter);
      } catch {
        parsedFilter = {};
      }
    }
    return this.locationsService.findAll({ page, limit, sort, filter: parsedFilter || {} }, tenantId);
  }

  @ApiOperation({ summary: 'Lightweight location list for dropdowns' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Lookup options' })
  @Get('lookup')
  @Scopes(Scope.LOCATIONS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER, Role.PHARMACIST)
  lookup(
    @Query('search') search: string,
    @Query('limit') limit: number = 25,
    @TenantId() tenantId: string,
  ) {
    return this.locationsService.lookup(tenantId, search, Math.min(limit, 25));
  }

  @ApiOperation({ summary: 'Get location by ID' })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiResponse({ status: 200, description: 'Location details' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  @Get(':id')
  @Scopes(Scope.LOCATIONS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.locationsService.findOne(id, tenantId);
  }

  @ApiOperation({ summary: 'Update a location' })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @Patch(':id')
  @Scopes(Scope.LOCATIONS)
  @Roles(Role.ADMIN, Role.MANAGER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.locationsService.update(id, dto, req.user.userId, tenantId, req.user.username);
  }

  @ApiOperation({ summary: 'Delete a location' })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @Delete(':id')
  @Scopes(Scope.LOCATIONS)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @Req() req: RequestWithUser, @TenantId() tenantId: string) {
    return this.locationsService.remove(id, req.user.userId, tenantId);
  }
}
