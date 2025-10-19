import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SCOPES_KEY } from './scopes.decorator';
import { Role, RoleDocument } from './schemas/role.schema';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(
      SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredScopes) {
      return true; // No scopes required, allow access
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.roles) {
      return false;
    }

    try {
      // Get user roles from database to fetch their scopes
      const userRoles = await this.roleModel
        .find({ name: { $in: user.roles } })
        .exec();

      const userScopes: string[] = userRoles.flatMap((role) => role.scopes);

      // Check if user has at least one of the required scopes
      return requiredScopes.some((scope) => userScopes.includes(scope));
    } catch (error) {
      console.error('Error checking scopes:', error);
      return false;
    }
  }
}
