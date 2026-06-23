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
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';
import { JwtAuthGuard } from '@auth/jwt-auth.guard';
import { RolesGuard, ScopesGuard } from '@common/guards';
import { Roles, Scopes, TenantId } from '@common/decorators';
import { Role, Scope } from '@common/enums';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiOperation } from '@nestjs/swagger';
import { QueryDto } from '@common/dto/query.dto';

@ApiTags('purchase-orders')
@ApiBearerAuth('JWT-auth')
@Controller('purchase-orders')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  create(
    @Body() createPurchaseOrderDto: CreatePurchaseOrderDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.purchaseOrdersService.create(
      createPurchaseOrderDto,
      req.user.userId,
      tenantId,
      req.user.username,
    );
  }

  @Get()
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiQuery({ name: 'query', type: QueryDto })
  findAll(
    @Query() query: Omit<QueryDto, 'filter'>,
    @TenantId() tenantId: string,
  ) {
    const { page, limit, sort, ...filter } = query;
    return this.purchaseOrdersService.findAll({ page, limit, sort, filter }, tenantId);
  }

  @Get('stats')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  getStats(@TenantId() tenantId: string) {
    return this.purchaseOrdersService.getStats(tenantId);
  }

  @Get('analytics/monthly')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  @ApiOperation({ summary: 'Get monthly PO totals for the last N months' })
  @ApiQuery({ name: 'months', required: false })
  getMonthlyAnalytics(@TenantId() tenantId: string, @Query('months') months?: string) {
    return this.purchaseOrdersService.getMonthlyAnalytics(tenantId, months ? parseInt(months, 10) : 12);
  }

  @Get(':id')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.purchaseOrdersService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  update(
    @Param('id') id: string,
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.purchaseOrdersService.update(
      id,
      updatePurchaseOrderDto,
      req.user.userId,
      tenantId,
      req.user.username,
    );
  }

  @Delete(':id')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN)
  remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.purchaseOrdersService.remove(id, req.user.userId, tenantId);
  }

  @Post('reorder')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Create a draft reorder PO from low-stock items',
    description: 'Creates a draft PO with the supplied items. The user can edit the draft before approving.',
  })
  reorder(
    @Body() body: {
      items: Array<{
        inventory_item_id?: string;
        name: string;
        sku?: string;
        quantity: number;
        unit_price?: number;
        batch_number?: string;
        expiry_date?: string;
      }>;
      vendor_id?: string;
      vendor_name?: string;
      shipping_address?: string;
      notes?: string;
    },
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.purchaseOrdersService.createReorderPO(
      body, req.user.userId, tenantId, req.user.username,
    );
  }

  @Post(':id/approve')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER)
  approve(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.purchaseOrdersService.approve(id, req.user.userId, tenantId, req.user.username);
  }
}
