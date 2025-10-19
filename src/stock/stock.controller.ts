import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
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

  // Stock Transfer Endpoints
  @ApiOperation({
    summary: 'Create a stock transfer between locations',
    description: 'Creates a new stock transfer (Admin/Manager only)',
  })
  @ApiBody({ type: CreateStockTransferDto })
  @ApiResponse({
    status: 201,
    description: 'Stock transfer created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Post('transfers')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER)
  createTransfer(
    @Body() createStockTransferDto: CreateStockTransferDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return this.stockService.createTransfer(createStockTransferDto, userId);
  }

  @ApiOperation({
    summary: 'List stock transfers',
    description: 'Retrieves all stock transfers',
  })
  @ApiResponse({
    status: 200,
    description: 'List of stock transfers retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({ name: 'query', type: QueryDto })
  @Get('transfers')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  listTransfers(@Query() query: Omit<QueryDto, 'filter'>) {
    const { page, limit, sort, ...filter } = query;
    return this.stockService.listTransfers({ page, limit, sort, filter });
  }

  @ApiOperation({
    summary: 'Mark a stock transfer as completed',
    description: 'Completes a stock transfer (Admin/Manager only)',
  })
  @ApiParam({ name: 'id', description: 'Transfer ID' })
  @ApiResponse({
    status: 200,
    description: 'Stock transfer completed successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  @Put('transfers/:id/complete')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER)
  completeTransfer(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.stockService.completeTransfer(id, userId);
  }

  // Stock Adjustment Endpoints
  @ApiOperation({
    summary: 'Create a stock adjustment',
    description: 'Creates a new stock adjustment (Admin/Manager only)',
  })
  @ApiBody({ type: CreateStockAdjustmentDto })
  @ApiResponse({
    status: 201,
    description: 'Stock adjustment created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Post('adjustments')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER)
  createAdjustment(
    @Body() createStockAdjustmentDto: CreateStockAdjustmentDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return this.stockService.createAdjustment(createStockAdjustmentDto, userId);
  }

  @ApiOperation({
    summary: 'List stock adjustments',
    description: 'Retrieves all stock adjustments',
  })
  @ApiResponse({
    status: 200,
    description: 'List of stock adjustments retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({ name: 'query', type: QueryDto })
  @Get('adjustments')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  listAdjustments(@Query() query: Omit<QueryDto, 'filter'>) {
    const { page, limit, sort, ...filter } = query;
    return this.stockService.listAdjustments({ page, limit, sort, filter });
  }

  @ApiOperation({
    summary: 'Apply a stock adjustment',
    description: 'Applies a stock adjustment (Admin/Manager only)',
  })
  @ApiParam({ name: 'id', description: 'Adjustment ID' })
  @ApiResponse({
    status: 200,
    description: 'Stock adjustment applied successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Adjustment not found' })
  @Put('adjustments/:id/apply')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER)
  applyAdjustment(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.stockService.applyAdjustment(id, userId);
  }
}
