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
import { Roles, Scopes } from '@common/decorators';
import { Role, Scope } from '@common/enums';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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
  ) {
    const userId = req.user.userId;
    return this.purchaseOrdersService.create(createPurchaseOrderDto, userId);
  }

  @Get()
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.USER)
  @ApiQuery({ name: 'query', type: QueryDto })
  findAll(@Query() query: Omit<QueryDto, 'filter'>) {
    const { page, limit, sort, ...filter } = query;
    return this.purchaseOrdersService.findAll({ page, limit, sort, filter });
  }

  @Get(':id')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.USER)
  findOne(@Param('id') id: string) {
    return this.purchaseOrdersService.findOne(id);
  }

  @Patch(':id')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  update(
    @Param('id') id: string,
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return this.purchaseOrdersService.update(
      id,
      updatePurchaseOrderDto,
      userId,
    );
  }

  @Delete(':id')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.purchaseOrdersService.remove(id, userId);
  }

  @Post(':id/approve')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER)
  approve(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.purchaseOrdersService.approve(id, userId);
  }
}
