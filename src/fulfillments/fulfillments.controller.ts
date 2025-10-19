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
import { FulfillmentsService } from './fulfillments.service';
import { CreateFulfillmentDto } from './dto/create-fulfillment.dto';
import { UpdateFulfillmentDto } from './dto/update-fulfillment.dto';
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
import { FulfillmentResponseDto } from './dto/fulfillment-response.dto';
import { QueryDto } from '@common/dto/query.dto';

@ApiTags('fulfillments')
@ApiBearerAuth('JWT-auth')
@Controller('fulfillments')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class FulfillmentsController {
  constructor(private readonly fulfillmentsService: FulfillmentsService) {}

  @ApiOperation({
    summary: 'Create a new fulfillment record',
    description: 'Creates a new fulfillment record (Admin/Manager only)',
  })
  @ApiBody({ type: CreateFulfillmentDto })
  @ApiResponse({
    status: 201,
    description: 'Fulfillment record created successfully',
    type: FulfillmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Manager role required',
  })
  @Post()
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER)
  create(
    @Body() createFulfillmentDto: CreateFulfillmentDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return this.fulfillmentsService.create(createFulfillmentDto, userId);
  }

  @ApiOperation({
    summary: 'Get all fulfillment records',
    description: 'Retrieves all fulfillment records',
  })
  @ApiResponse({
    status: 200,
    description: 'List of fulfillment records retrieved successfully',
    type: [FulfillmentResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiQuery({ name: 'query', type: QueryDto })
  @Get()
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  findAll(@Query() query: Omit<QueryDto, 'filter'>) {
    const { page, limit, sort, ...filter } = query;
    return this.fulfillmentsService.findAll({ page, limit, sort, filter });
  }

  @ApiOperation({
    summary: 'Get fulfillment record by ID',
    description: 'Retrieves a specific fulfillment record by ID',
  })
  @ApiParam({ name: 'id', description: 'Fulfillment ID' })
  @ApiResponse({
    status: 200,
    description: 'Fulfillment record retrieved successfully',
    type: FulfillmentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Fulfillment record not found' })
  @Get(':id')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  findOne(@Param('id') id: string) {
    return this.fulfillmentsService.findOne(id);
  }

  @ApiOperation({
    summary: 'Update fulfillment record',
    description: 'Updates a fulfillment record by ID (Admin/Manager only)',
  })
  @ApiParam({ name: 'id', description: 'Fulfillment ID' })
  @ApiBody({ type: UpdateFulfillmentDto })
  @ApiResponse({
    status: 200,
    description: 'Fulfillment record updated successfully',
    type: FulfillmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Fulfillment record not found' })
  @Patch(':id')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN, Role.MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateFulfillmentDto: UpdateFulfillmentDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return this.fulfillmentsService.update(id, updateFulfillmentDto, userId);
  }

  @ApiOperation({
    summary: 'Delete fulfillment record',
    description: 'Deletes a fulfillment record by ID (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Fulfillment ID' })
  @ApiResponse({ status: 200, description: 'Fulfillment record deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Fulfillment record not found' })
  @Delete(':id')
  @Scopes(Scope.PURCHASE_ORDERS)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.fulfillmentsService.remove(id, userId);
  }
}
