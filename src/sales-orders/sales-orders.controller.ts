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
import { SalesOrdersService } from './sales-orders.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';
import { JwtAuthGuard } from '@auth/jwt-auth.guard';
import { RolesGuard, ScopesGuard } from '@common/guards';
import { Roles, Scopes, TenantId } from '@common/decorators';
import { Role, Scope } from '@common/enums';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiOperation } from '@nestjs/swagger';
import { QueryDto } from '@common/dto/query.dto';

@ApiTags('sales-orders')
@ApiBearerAuth('JWT-auth')
@Controller('sales-orders')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class SalesOrdersController {
  constructor(private readonly salesOrdersService: SalesOrdersService) {}

  @Post()
  @Scopes(Scope.SALES_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  create(
    @Body() createSalesOrderDto: CreateSalesOrderDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.salesOrdersService.create(createSalesOrderDto, req.user.userId, tenantId);
  }

  @Get('stats')
  @Scopes(Scope.SALES_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  getStats(@TenantId() tenantId: string) {
    return this.salesOrdersService.getStats(tenantId);
  }

  @Get('analytics/monthly')
  @Scopes(Scope.SALES_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  @ApiOperation({ summary: 'Get monthly SO revenue for the last N months' })
  @ApiQuery({ name: 'months', required: false })
  getMonthlyAnalytics(@TenantId() tenantId: string, @Query('months') months?: string) {
    return this.salesOrdersService.getMonthlyAnalytics(tenantId, months ? parseInt(months, 10) : 12);
  }

  @Get()
  @Scopes(Scope.SALES_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiQuery({ name: 'query', type: QueryDto })
  findAll(@Query() query: Omit<QueryDto, 'filter'>, @TenantId() tenantId: string) {
    const { page, limit, sort, ...filter } = query;
    return this.salesOrdersService.findAll({ page, limit, sort, filter }, tenantId);
  }

  @Get(':id')
  @Scopes(Scope.SALES_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  findOne(@Param('id') id: string) {
    return this.salesOrdersService.findOne(id);
  }

  @Patch(':id')
  @Scopes(Scope.SALES_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  update(
    @Param('id') id: string,
    @Body() updateSalesOrderDto: UpdateSalesOrderDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.salesOrdersService.update(id, updateSalesOrderDto, req.user.userId, tenantId);
  }

  @Delete(':id')
  @Scopes(Scope.SALES_ORDERS)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @Req() req: RequestWithUser, @TenantId() tenantId: string) {
    return this.salesOrdersService.remove(id, req.user.userId, tenantId);
  }

  @Post(':id/ship')
  @Scopes(Scope.SALES_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  ship(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.salesOrdersService.ship(id, req.user.userId);
  }

  @Post(':id/invoice')
  @Scopes(Scope.SALES_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  invoice(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.salesOrdersService.invoice(id, req.user.userId);
  }
}
