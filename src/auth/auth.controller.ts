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
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { LoginDto } from './dto/login.dto';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';
import { JwtAuthGuard } from './jwt-auth.guard';
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
import { AuthResponseDto } from './dto/auth-response.dto';
import { QueryDto } from '@common/dto/query.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'User login',
    description: 'Authenticates user and returns JWT token',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful, JWT token returned',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOperation({
    summary: 'User logout',
    description: 'Logs out the current user',
  })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @Post('logout')
  logout() {
    return this.authService.logout();
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create user',
    description: 'Creates a new user (Admin only)',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @Post('users')
  @Scopes(Scope.USER_MANAGEMENT)
  @Roles(Role.ADMIN)
  createUser(
    @Body() createUserDto: CreateUserDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return this.authService.createUser(createUserDto, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieves all users (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiQuery({ name: 'query', type: QueryDto })
  @Get('users')
  @Scopes(Scope.USER_MANAGEMENT)
  @Roles(Role.ADMIN)
  findAllUsers(@Query() query: Omit<QueryDto, 'filter'>) {
    const { page, limit, sort, ...filter } = query;
    return this.authService.findAllUsers({ page, limit, sort, filter });
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieves a specific user by ID (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get('users/:id')
  @Scopes(Scope.USER_MANAGEMENT)
  @Roles(Role.ADMIN)
  findOneUser(@Param('id') id: string) {
    return this.authService.findOneUser(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update user',
    description: 'Updates a user by ID (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Patch('users/:id')
  @Scopes(Scope.USER_MANAGEMENT)
  @Roles(Role.ADMIN)
  updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return this.authService.updateUser(id, updateUserDto, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete user',
    description: 'Deletes a user by ID (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Delete('users/:id')
  @Scopes(Scope.USER_MANAGEMENT)
  @Roles(Role.ADMIN)
  removeUser(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.authService.removeUser(id, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create role',
    description: 'Creates a new role (Admin only)',
  })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @Post('roles')
  @Scopes(Scope.USER_MANAGEMENT)
  @Roles(Role.ADMIN)
  createRole(
    @Body() createRoleDto: CreateRoleDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return this.authService.createRole(createRoleDto, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get all roles',
    description: 'Retrieves all roles (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of roles retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @Get('roles')
  @Scopes(Scope.USER_MANAGEMENT)
  @Roles(Role.ADMIN)
  findAllRoles() {
    return this.authService.findAllRoles();
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get role by ID',
    description: 'Retrieves a specific role by ID (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @Get('roles/:id')
  @Scopes(Scope.USER_MANAGEMENT)
  @Roles(Role.ADMIN)
  findOneRole(@Param('id') id: string) {
    return this.authService.findOneRole(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update role',
    description: 'Updates a role by ID (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @Patch('roles/:id')
  @Scopes(Scope.USER_MANAGEMENT)
  @Roles(Role.ADMIN)
  updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.userId;
    return this.authService.updateRole(id, updateRoleDto, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete role',
    description: 'Deletes a role by ID (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @Delete('roles/:id')
  @Scopes(Scope.USER_MANAGEMENT)
  @Roles(Role.ADMIN)
  removeRole(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.authService.removeRole(id, userId);
  }
}
