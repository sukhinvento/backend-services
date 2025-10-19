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
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
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
import { VendorResponseDto } from './dto/vendor-response.dto';
import { QueryDto } from '@common/dto/query.dto';

@ApiTags('vendors')
@ApiBearerAuth('JWT-auth')
@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @ApiOperation({
    summary: 'Create a new vendor',
    description: 'Creates a new vendor (Admin/Manager only)',
  })
  @ApiBody({ type: CreateVendorDto })
  @ApiResponse({
    status: 201,
    description: 'Vendor created successfully',
    type: VendorResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Manager role required',
  })
  @Post()
  @Scopes(Scope.VENDORS)
  @Roles(Role.ADMIN, Role.MANAGER)
  create(
    @Body() createVendorDto: CreateVendorDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return this.vendorsService.create(createVendorDto, userId);
  }

  @ApiOperation({
    summary: 'Get all vendors',
    description: 'Retrieves all vendors',
  })
  @ApiResponse({
    status: 200,
    description: 'List of vendors retrieved successfully',
    type: [VendorResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiQuery({ name: 'query', type: QueryDto })
  @Get()
  @Scopes(Scope.VENDORS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  findAll(@Query() query: Omit<QueryDto, 'filter'>) {
    const { page, limit, sort, ...filter } = query;
    return this.vendorsService.findAll({ page, limit, sort, filter });
  }

  @ApiOperation({
    summary: 'Get vendor by ID',
    description: 'Retrieves a specific vendor by ID',
  })
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  @ApiResponse({
    status: 200,
    description: 'Vendor retrieved successfully',
    type: VendorResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  @Get(':id')
  @Scopes(Scope.VENDORS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER)
  findOne(@Param('id') id: string) {
    return this.vendorsService.findOne(id);
  }

  @Patch(':id')
  @Scopes(Scope.VENDORS)
  @Roles(Role.ADMIN, Role.MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateVendorDto: UpdateVendorDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return this.vendorsService.update(id, updateVendorDto, userId);
  }

  @Delete(':id')
  @Scopes(Scope.VENDORS)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.vendorsService.remove(id, userId);
  }
}
