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
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtAuthGuard } from '@auth/jwt-auth.guard';
import { RolesGuard, ScopesGuard } from '@common/guards';
import { Roles, Scopes, TenantId } from '@common/decorators';
import { Role, Scope } from '@common/enums';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';

@ApiTags('rooms')
@ApiBearerAuth('JWT-auth')
@Controller('rooms')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @Scopes(Scope.ROOMS)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create a new room' })
  create(
    @Body() createRoomDto: CreateRoomDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.roomsService.create(createRoomDto, req.user.userId, tenantId, req.user.username);
  }

  @Get()
  @Scopes(Scope.ROOMS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.BILLING_STAFF, Role.LAB_TECHNICIAN, Role.PHARMACIST)
  @ApiOperation({ summary: 'Get all rooms' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'department', required: false })
  @ApiQuery({ name: 'floor', required: false })
  findAll(
    @TenantId() tenantId: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('department') department?: string,
    @Query('floor') floor?: number,
  ) {
    return this.roomsService.findAll(tenantId, status, type, department, floor);
  }

  @Get('available')
  @Scopes(Scope.ROOMS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.BILLING_STAFF, Role.LAB_TECHNICIAN, Role.PHARMACIST)
  @ApiOperation({ summary: 'Get available rooms' })
  findAvailable(@TenantId() tenantId: string) {
    return this.roomsService.findAvailable(tenantId);
  }

  @Get('stats')
  @Scopes(Scope.ROOMS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.BILLING_STAFF, Role.LAB_TECHNICIAN, Role.PHARMACIST)
  @ApiOperation({ summary: 'Get room statistics' })
  getStats(@TenantId() tenantId: string) {
    return this.roomsService.getStats(tenantId);
  }

  @Get(':id')
  @Scopes(Scope.ROOMS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER, Role.VIEWER, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.BILLING_STAFF, Role.LAB_TECHNICIAN, Role.PHARMACIST)
  @ApiOperation({ summary: 'Get a room by ID' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.roomsService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Scopes(Scope.ROOMS)
  @Roles(Role.ADMIN, Role.MANAGER, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Update a room' })
  update(
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @Req() req: RequestWithUser,
    @TenantId() tenantId: string,
  ) {
    return this.roomsService.update(id, updateRoomDto, req.user.userId, tenantId, req.user.username);
  }

  @Delete(':id')
  @Scopes(Scope.ROOMS)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a room' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser, @TenantId() tenantId: string) {
    return this.roomsService.remove(id, req.user.userId, tenantId);
  }
}
