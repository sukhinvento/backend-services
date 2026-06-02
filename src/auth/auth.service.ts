import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { LoginDto } from './dto/login.dto';
import { User, UserDocument } from './schemas/user.schema';
import { Role, RoleDocument } from './schemas/role.schema';
import { AuditService } from '@audit/audit.service';
import * as bcrypt from 'bcrypt';
import { QueryDto } from '@common/dto/query.dto';
import { QueryBuilderService } from '@common/services/query-builder.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    private readonly auditService: AuditService,
    private readonly jwtService: JwtService,
    private readonly queryBuilder: QueryBuilderService<UserDocument>,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userModel
      .findOne({
        username: loginDto.username,
      })
      .exec();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate that user has a tenantId
    if (!user.tenantId) {
      throw new UnauthorizedException('User not associated with any tenant');
    }

    // Compare the plain text password with the hashed password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userRoles = await this.roleModel
      .find({ name: { $in: user.roles } })
      .exec();
    const scopes: string[] = userRoles.flatMap((role) => role.scopes);

    const payload = {
      username: user.username,
      sub: user.id as string,
      roles: userRoles.map((r) => r.name),
      scopes: scopes,
      tenantId: user.tenantId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      userId: user.id as string,
      username: user.username,
      name: user.name || ((user as any).first_name ? `${(user as any).first_name} ${(user as any).last_name || ''}`.trim() : user.username),
      email: user.email || '',
      phone: user.phone || '',
      department: user.department || '',
      designation: user.designation || '',
      roles: userRoles.map((role) => role.name),
      scopes,
      tenantId: user.tenantId,
    };
  }

  logout() {
    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string, username: string, tenantId: string) {
    const user = await this.findUserByIdOrUsername(userId, username, tenantId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    // Return without password_hash
    const userObj = user.toObject();
    delete (userObj as any).password_hash;
    return userObj;
  }

  private async findUserByIdOrUsername(userId: string, username: string, tenantId: string) {
    // Try _id first, then fall back to username (BaseSchema's auto id field may differ from _id)
    let user = await this.userModel.findOne({ _id: userId, tenantId }).exec();
    if (!user && username) {
      user = await this.userModel.findOne({ username, tenantId }).exec();
    }
    return user;
  }

  async updateProfile(userId: string, username: string, updateDto: UpdateUserDto, tenantId: string) {
    const user = await this.findUserByIdOrUsername(userId, username, tenantId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Only allow updating profile fields, not roles/password/tenantId
    const allowedFields: Record<string, any> = {};
    if (updateDto.name !== undefined) allowedFields.name = updateDto.name;
    if (updateDto.email !== undefined) allowedFields.email = updateDto.email;
    if (updateDto.phone !== undefined) allowedFields.phone = updateDto.phone;
    if (updateDto.department !== undefined) allowedFields.department = updateDto.department;
    if (updateDto.designation !== undefined) allowedFields.designation = updateDto.designation;

    const updated = await this.userModel
      .findByIdAndUpdate(
        user._id,
        { ...allowedFields, updatedBy: userId },
        { new: true },
      )
      .select('-password_hash')
      .exec();

    void this.auditService.log({
      userId,
      action: 'update_profile',
      entity: 'user',
      entityId: (user._id as any).toString(),
      oldValue: { name: (user as any).name, email: (user as any).email, phone: (user as any).phone, department: (user as any).department, designation: (user as any).designation },
      newValue: allowedFields,
      tenantId,
    });

    return updated;
  }

  async changePassword(userId: string, username: string, currentPassword: string, newPassword: string, tenantId: string) {
    const user = await this.findUserByIdOrUsername(userId, username, tenantId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await this.userModel.findByIdAndUpdate(user._id, {
      password_hash: hashedPassword,
      updatedBy: userId,
    }).exec();

    void this.auditService.log({
      userId,
      action: 'change_password',
      entity: 'user',
      entityId: (user._id as any).toString(),
      tenantId,
    });

    return { message: 'Password changed successfully' };
  }

  async createUser(createUserDto: CreateUserDto, authUserId: string, authTenantId: string) {
    // Validate tenantId is provided
    if (!createUserDto.tenantId) {
      throw new BadRequestException('TenantId is required for user creation');
    }

    // Check if the creating user has permission to create users for this tenant
    // For now, we'll allow if the tenantId matches the auth user's tenantId
    // In a more complex scenario, you might want to check if the user is a super admin
    if (createUserDto.tenantId !== authTenantId) {
      throw new UnauthorizedException('Cannot create user for different tenant');
    }

    // Check for duplicate username within the same tenant
    const existingUser = await this.userModel.findOne({
      username: createUserDto.username,
      tenantId: createUserDto.tenantId,
    }).exec();

    if (existingUser) {
      throw new BadRequestException('Username already exists in this tenant');
    }

    // Hash the password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltRounds,
    );

    const newUser = new this.userModel({
      username: createUserDto.username,
      password_hash: hashedPassword,
      name: createUserDto.name,
      email: createUserDto.email,
      phone: createUserDto.phone,
      department: createUserDto.department,
      designation: createUserDto.designation,
      roles: createUserDto.roles,
      tenantId: createUserDto.tenantId,
      createdBy: authUserId,
      updatedBy: authUserId,
    });
    const savedUser = await newUser.save();

    void this.auditService.log({
      userId: authUserId,
      action: 'create',
      entity: 'user',
      entityId: savedUser.id as string,

      newValue: savedUser.toObject() as User,
      tenantId: authTenantId,
    });

    return savedUser;
  }

  async findAllUsers(query: QueryDto, tenantId: string) {
    // Add tenantId filter to the query
    const queryWithTenant = {
      ...query,
      filter: {
        ...query.filter,
        tenantId,
      },
    };
    return this.queryBuilder.buildQuery(this.userModel, queryWithTenant).exec();
  }

  async findOneUser(id: string, tenantId: string) {
    return this.userModel.findOne({ _id: id, tenantId }).exec();
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
    authUserId: string,
    authTenantId: string,
  ) {
    const oldUser = await this.userModel.findOne({ _id: id, tenantId: authTenantId }).exec();
    if (!oldUser) {
      throw new Error('User not found or access denied');
    }

    // If updating tenantId, validate the new tenantId
    if (updateUserDto.tenantId && updateUserDto.tenantId !== authTenantId) {
      throw new UnauthorizedException('Cannot change user to different tenant');
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        id,
        { ...updateUserDto, updatedBy: authUserId },
        { new: true },
      )
      .exec();

    void this.auditService.log({
      userId: authUserId,
      action: 'update',
      entity: 'user',
      entityId: id,

      oldValue: oldUser?.toObject() as User,

      newValue: updatedUser?.toObject() as User,
      tenantId: authTenantId,
    });

    return updatedUser;
  }

  async removeUser(id: string, authUserId: string, authTenantId: string) {
    const removedUser = await this.userModel.findOneAndDelete({ _id: id, tenantId: authTenantId }).exec();
    if (!removedUser) {
      throw new Error('User not found or access denied');
    }

    void this.auditService.log({
      userId: authUserId,
      action: 'delete',
      entity: 'user',
      entityId: id,

      oldValue: removedUser?.toObject() as User,
      tenantId: authTenantId,
    });

    return { id };
  }

  async createRole(createRoleDto: CreateRoleDto, authUserId: string) {
    const newRole = new this.roleModel({
      ...createRoleDto,
      createdBy: authUserId,
      updatedBy: authUserId,
    });
    const savedRole = await newRole.save();

    void this.auditService.log({
      userId: authUserId,
      action: 'create',
      entity: 'role',
      entityId: savedRole.id as string,

      newValue: savedRole.toObject() as Role,
      tenantId: 'system',
    });

    return savedRole;
  }

  async findAllRoles() {
    return this.roleModel.find().exec();
  }

  async findOneRole(id: string) {
    return this.roleModel.findById(id).exec();
  }

  async updateRole(
    id: string,
    updateRoleDto: UpdateRoleDto,
    authUserId: string,
  ) {
    const oldRole = await this.roleModel.findById(id).exec();
    const updatedRole = await this.roleModel
      .findByIdAndUpdate(
        id,
        { ...updateRoleDto, updatedBy: authUserId },
        { new: true },
      )
      .exec();

    void this.auditService.log({
      userId: authUserId,
      action: 'update',
      entity: 'role',
      entityId: id,

      oldValue: oldRole?.toObject() as Role,

      newValue: updatedRole?.toObject() as Role,
      tenantId: 'system',
    });

    return updatedRole;
  }

  async removeRole(id: string, authUserId: string) {
    const removedRole = await this.roleModel.findByIdAndDelete(id).exec();

    void this.auditService.log({
      userId: authUserId,
      action: 'delete',
      entity: 'role',
      entityId: id,

      oldValue: removedRole?.toObject() as Role,
      tenantId: 'system',
    });

    return { id };
  }
}
