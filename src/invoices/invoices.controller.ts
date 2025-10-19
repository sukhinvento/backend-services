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
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';
import { JwtAuthGuard } from '@auth/jwt-auth.guard';
import { RolesGuard, ScopesGuard } from '@common/guards';
import { Roles, Scopes } from '@common/decorators';
import { Role, Scope } from '@common/enums';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { QueryDto } from '@common/dto/query.dto';

@ApiTags('invoices')
@ApiBearerAuth('JWT-auth')
@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Scopes(Scope.INVOICES)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  create(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return this.invoicesService.create(createInvoiceDto, userId);
  }

  @Get()
  @Scopes(Scope.INVOICES)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.USER)
  @ApiQuery({ name: 'query', type: QueryDto })
  findAll(@Query() query: Omit<QueryDto, 'filter'>) {
    const { page, limit, sort, ...filter } = query;
    return this.invoicesService.findAll({ page, limit, sort, filter });
  }

  @Get(':id')
  @Scopes(Scope.INVOICES)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.USER)
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id')
  @Scopes(Scope.INVOICES)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return this.invoicesService.update(id, updateInvoiceDto, userId);
  }

  @Delete(':id')
  @Scopes(Scope.INVOICES)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.invoicesService.remove(id, userId);
  }

  @Post(':id/pay')
  @Scopes(Scope.INVOICES)
  @Roles(Role.ADMIN, Role.USER)
  pay(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.invoicesService.pay(id, userId);
  }
}
