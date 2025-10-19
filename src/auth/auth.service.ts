import { Injectable, UnauthorizedException } from '@nestjs/common';
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
    };

    return {
      access_token: this.jwtService.sign(payload),
      roles: userRoles.map((role) => role.name),
      scopes,
    };
  }

  logout() {
    return { message: 'Logged out successfully' };
  }

  async createUser(createUserDto: CreateUserDto, authUserId: string) {
    // Hash the password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltRounds,
    );

    const newUser = new this.userModel({
      username: createUserDto.username,
      password_hash: hashedPassword,
      roles: createUserDto.roles,
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
      tenantId: 'system',
    });

    return savedUser;
  }

  async findAllUsers(query: QueryDto) {
    return this.queryBuilder.buildQuery(this.userModel, query).exec();
  }

  async findOneUser(id: string) {
    return this.userModel.findById(id).exec();
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
    authUserId: string,
  ) {
    const oldUser = await this.userModel.findById(id).exec();
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
      tenantId: 'system',
    });

    return updatedUser;
  }

  async removeUser(id: string, authUserId: string) {
    const removedUser = await this.userModel.findByIdAndDelete(id).exec();

    void this.auditService.log({
      userId: authUserId,
      action: 'delete',
      entity: 'user',
      entityId: id,

      oldValue: removedUser?.toObject() as User,
      tenantId: 'system',
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
