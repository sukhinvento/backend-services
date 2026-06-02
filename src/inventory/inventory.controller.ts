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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { JwtAuthGuard } from '@auth/jwt-auth.guard';
import { RolesGuard, ScopesGuard } from '@common/guards';
import { Roles, Scopes, TenantId } from '@common/decorators';
import { Role, Scope } from '@common/enums';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';

@ApiTags('inventory')
@ApiBearerAuth('JWT-auth')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Scopes(Scope.INVENTORY)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create an inventory item' })
  create(
    @Body() dto: CreateInventoryItemDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.inventoryService.create(dto, req.user.userId, tenantId, req.user.username);
  }

  @Get()
  @Scopes(Scope.INVENTORY)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER, Role.PHARMACIST, Role.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Get all inventory items' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'low_stock', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @TenantId() tenantId: string,
    @Query('category') category?: string,
    @Query('low_stock') low_stock?: string,
    @Query('search') search?: string,
  ) {
    return this.inventoryService.findAll(tenantId, category, low_stock === 'true', search);
  }

  @Get('stats')
  @Scopes(Scope.INVENTORY)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get inventory statistics' })
  getStats(@TenantId() tenantId: string) {
    return this.inventoryService.getStats(tenantId);
  }

  @Get('analytics/dashboard')
  @Scopes(Scope.INVENTORY)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  @ApiOperation({ summary: 'Get pre-aggregated inventory dashboard analytics' })
  getDashboardAnalytics(@TenantId() tenantId: string) {
    return this.inventoryService.getDashboardAnalytics(tenantId);
  }

  @Get(':id')
  @Scopes(Scope.INVENTORY)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER, Role.PHARMACIST, Role.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Get an inventory item by ID' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.inventoryService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Scopes(Scope.INVENTORY)
  @Roles(Role.ADMIN, Role.MANAGER, Role.PHARMACIST)
  @ApiOperation({ summary: 'Update an inventory item' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryItemDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.inventoryService.update(id, dto, req.user.userId, tenantId, req.user.username);
  }

  @Delete(':id')
  @Scopes(Scope.INVENTORY)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete an inventory item' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser, @TenantId() tenantId: string) {
    return this.inventoryService.remove(id, req.user.userId, tenantId);
  }

  @Post(':id/adjust-stock')
  @Scopes(Scope.INVENTORY)
  @Roles(Role.ADMIN, Role.MANAGER, Role.PHARMACIST)
  @ApiOperation({ summary: 'Adjust stock for an inventory item' })
  adjustStock(
    @Param('id') id: string,
    @Body() dto: AdjustStockDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.inventoryService.adjustStock(id, dto, req.user.userId, tenantId, req.user.username);
  }
}
