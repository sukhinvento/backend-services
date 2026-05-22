import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Put,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto';
import { UpdateStockTransferDto } from './dto/update-stock-transfer.dto';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { UpdateStockAdjustmentDto } from './dto/update-stock-adjustment.dto';
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
import { QueryDto } from '@common/dto/query.dto';

@ApiTags('stock')
@ApiBearerAuth('JWT-auth')
@Controller('stock')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  // ─── Stock Transfer Endpoints ─────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a stock transfer' })
  @ApiBody({ type: CreateStockTransferDto })
  @ApiResponse({ status: 201, description: 'Stock transfer created' })
  @Post('transfers')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER)
  createTransfer(@Body() dto: CreateStockTransferDto, @Req() req: RequestWithUser) {
    return this.stockService.createTransfer(dto, req.user.userId, req.user.tenantId);
  }

  @ApiOperation({ summary: 'List stock transfers' })
  @ApiQuery({ name: 'query', type: QueryDto })
  @Get('transfers')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  listTransfers(@Query() query: Omit<QueryDto, 'filter'>, @Req() req: RequestWithUser) {
    const { page, limit, sort, ...filter } = query;
    return this.stockService.listTransfers({ page, limit, sort, filter }, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get stock transfer stats' })
  @Get('transfers/stats')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  getTransferStats(@Req() req: RequestWithUser) {
    return this.stockService.getTransferStats(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get a single stock transfer' })
  @ApiParam({ name: 'id', description: 'Transfer ID' })
  @Get('transfers/:id')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  findOneTransfer(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.stockService.findOneTransfer(id, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Update a stock transfer' })
  @ApiParam({ name: 'id', description: 'Transfer ID' })
  @Patch('transfers/:id')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER)
  updateTransfer(
    @Param('id') id: string,
    @Body() dto: UpdateStockTransferDto,
    @Req() req: RequestWithUser,
  ) {
    return this.stockService.updateTransfer(id, dto, req.user.userId, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Delete a stock transfer' })
  @ApiParam({ name: 'id', description: 'Transfer ID' })
  @Delete('transfers/:id')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER)
  deleteTransfer(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.stockService.deleteTransfer(id, req.user.userId, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Mark a stock transfer as completed' })
  @ApiParam({ name: 'id', description: 'Transfer ID' })
  @Put('transfers/:id/complete')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER)
  completeTransfer(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.stockService.completeTransfer(id, req.user.userId, req.user.tenantId);
  }

  // ─── Stock Adjustment Endpoints ───────────────────────────────────────────

  @ApiOperation({ summary: 'Create a stock adjustment' })
  @ApiBody({ type: CreateStockAdjustmentDto })
  @ApiResponse({ status: 201, description: 'Stock adjustment created' })
  @Post('adjustments')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER)
  createAdjustment(@Body() dto: CreateStockAdjustmentDto, @Req() req: RequestWithUser) {
    return this.stockService.createAdjustment(dto, req.user.userId, req.user.tenantId);
  }

  @ApiOperation({ summary: 'List stock adjustments' })
  @ApiQuery({ name: 'query', type: QueryDto })
  @Get('adjustments')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  listAdjustments(@Query() query: Omit<QueryDto, 'filter'>, @Req() req: RequestWithUser) {
    const { page, limit, sort, ...filter } = query;
    return this.stockService.listAdjustments({ page, limit, sort, filter }, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get a single stock adjustment' })
  @ApiParam({ name: 'id', description: 'Adjustment ID' })
  @Get('adjustments/:id')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  findOneAdjustment(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.stockService.findOneAdjustment(id, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Update a stock adjustment' })
  @ApiParam({ name: 'id', description: 'Adjustment ID' })
  @Patch('adjustments/:id')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER)
  updateAdjustment(
    @Param('id') id: string,
    @Body() dto: UpdateStockAdjustmentDto,
    @Req() req: RequestWithUser,
  ) {
    return this.stockService.updateAdjustment(id, dto, req.user.userId, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Delete a stock adjustment' })
  @ApiParam({ name: 'id', description: 'Adjustment ID' })
  @Delete('adjustments/:id')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER)
  deleteAdjustment(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.stockService.deleteAdjustment(id, req.user.userId, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Apply a stock adjustment' })
  @ApiParam({ name: 'id', description: 'Adjustment ID' })
  @Put('adjustments/:id/apply')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER)
  applyAdjustment(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.stockService.applyAdjustment(id, req.user.userId, req.user.tenantId);
  }
}
