import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SCOPES_KEY } from '@common/decorators/scopes.decorator';
import { Role, RoleDocument } from '@auth/schemas/role.schema';
import type { RequestWithUser } from '@common/interfaces/request-with-user.interface';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Optional() @InjectModel(Role.name) private roleModel?: Model<RoleDocument>,
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

    if (!user) {
      return false;
    }

    // Use scopes from JWT token if available (preferred method)
    if (user.scopes) {
      return requiredScopes.some((scope) => user.scopes.includes(scope));
    }

    // Fallback: get scopes from database (for backward compatibility)
    if (!user.roles || !this.roleModel) {
      return false;
    }

    try {
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
