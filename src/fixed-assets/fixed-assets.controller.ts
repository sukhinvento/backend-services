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
import { FixedAssetsService } from './fixed-assets.service';
import { CreateFixedAssetDto } from './dto/create-fixed-asset.dto';
import { UpdateFixedAssetDto } from './dto/update-fixed-asset.dto';
import { RunDepreciationDto } from './dto/run-depreciation.dto';
import { JwtAuthGuard } from '@auth/jwt-auth.guard';
import { RolesGuard, ScopesGuard } from '@common/guards';
import { Roles, Scopes, TenantId } from '@common/decorators';
import { Role, Scope } from '@common/enums';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';

@ApiTags('fixed-assets')
@ApiBearerAuth('JWT-auth')
@Controller('fixed-assets')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class FixedAssetsController {
  constructor(private readonly fixedAssetsService: FixedAssetsService) {}

  @Get()
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'List fixed assets (paginated)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, description: 'active | disposed | fully_depreciated' })
  @ApiResponse({ status: 200, description: 'Paginated list of fixed assets' })
  findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.fixedAssetsService.findAll(tenantId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      status,
    });
  }

  @Get(':id')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Get a fixed asset by ID' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.fixedAssetsService.findOne(id, tenantId);
  }

  @Post()
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create a fixed asset' })
  @ApiResponse({ status: 201, description: 'Fixed asset created' })
  create(
    @Body() dto: CreateFixedAssetDto,
    @TenantId() tenantId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.fixedAssetsService.create(dto, tenantId, req.user.userId);
  }

  @Patch(':id')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update a fixed asset' })
  @ApiParam({ name: 'id' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFixedAssetDto,
    @TenantId() tenantId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.fixedAssetsService.update(id, dto, tenantId, req.user.userId);
  }

  // ── Depreciation ────────────────────────────────────────────────────────

  @Post('depreciation/run')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Run depreciation for all active assets for a period' })
  @ApiResponse({
    status: 200,
    description: 'Depreciation computed, journal entries created and posted',
  })
  runDepreciation(
    @Body() dto: RunDepreciationDto,
    @TenantId() tenantId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.fixedAssetsService.runDepreciation(dto.period, tenantId, req.user.userId);
  }

  @Get('depreciation/schedule/:id')
  @Scopes(Scope.FINANCE)
  @Roles(Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF)
  @ApiOperation({ summary: 'Get the full depreciation schedule for a single asset' })
  @ApiParam({ name: 'id', description: 'Fixed asset ID' })
  @ApiResponse({ status: 200, description: 'Depreciation schedule' })
  getDepreciationSchedule(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.fixedAssetsService.getDepreciationSchedule(id, tenantId);
  }
}
