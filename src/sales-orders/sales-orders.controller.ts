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
import { Roles, Scopes } from '@common/decorators';
import { Role, Scope } from '@common/enums';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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
  ) {
    const userId = req.user.userId;
    return this.salesOrdersService.create(createSalesOrderDto, userId);
  }

  @Get()
  @Scopes(Scope.SALES_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.USER)
  @ApiQuery({ name: 'query', type: QueryDto })
  findAll(@Query() query: Omit<QueryDto, 'filter'>) {
    const { page, limit, sort, ...filter } = query;
    return this.salesOrdersService.findAll({ page, limit, sort, filter });
  }

  @Get(':id')
  @Scopes(Scope.SALES_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.USER)
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
  ) {
    const userId = req.user.userId;
    return this.salesOrdersService.update(id, updateSalesOrderDto, userId);
  }

  @Delete(':id')
  @Scopes(Scope.SALES_ORDERS)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.salesOrdersService.remove(id, userId);
  }

  @Post(':id/ship')
  @Scopes(Scope.SALES_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  ship(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.salesOrdersService.ship(id, userId);
  }

  @Post(':id/invoice')
  @Scopes(Scope.SALES_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  invoice(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.salesOrdersService.invoice(id, userId);
  }
}
