# Authentication & Authorization Guide

## 🔐 Overview

This application uses JWT-based authentication with role and scope-based authorization for fine-grained access control.

## Authentication Components

### JWT Authentication
- **Guard**: `JwtAuthGuard` - Validates JWT tokens from Authorization header
- **Strategy**: `JwtStrategy` - Extracts and validates JWT payload
- **Interface**: `RequestWithUser` - Types the authenticated request object

### User Context
When authenticated, the request object contains:
```typescript
req.user = {
  userId: string;
  username: string;
  roles: string[];
}
```

## Authorization System

### Role-Based Access Control (RBAC)
Use the `@Roles()` decorator to restrict access based on user roles:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager')
@Post()
createResource() {
  // Only users with 'admin' OR 'manager' roles can access
}
```

### Scope-Based Access Control
Use the `@Scopes()` decorator for more granular permissions:

```typescript
@UseGuards(JwtAuthGuard, ScopesGuard)
@Scopes('vendors:create', 'vendors:update')
@Post()
createVendor() {
  // Only users whose roles have 'vendors:create' OR 'vendors:update' scopes
}
```

### Combined Authorization
For maximum security, combine both approaches:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
@Roles('admin', 'manager')
@Scopes('vendors:delete')
@Delete(':id')
deleteVendor() {
  // User must have the role AND the scope
}
```

## Implementation Examples

### Basic Authentication Only
```typescript
import { JwtAuthGuard } from '@auth/jwt-auth.guard';

@Controller('resources')
@UseGuards(JwtAuthGuard)
export class ResourceController {
  // All endpoints require valid JWT token
}
```

### Role-Based Controller with Enums
```typescript
import { JwtAuthGuard } from '@auth/jwt-auth.guard';
import { RolesGuard } from '@common/guards';
import { Roles } from '@common/decorators';
import { Role } from '@common/enums';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  // All endpoints require 'admin' role
}
```

### Granular Endpoint Control with Type-Safe Enums
```typescript
import { JwtAuthGuard } from '@auth/jwt-auth.guard';
import { RolesGuard, ScopesGuard } from '@common/guards';
import { Roles, Scopes } from '@common/decorators';
import { Role, Scope } from '@common/enums';

@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
export class VendorsController {
  
  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Scopes(Scope.VENDORS_READ)
  findAll() {
    // Read access for multiple roles with specific scope
  }
  
  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @Scopes(Scope.VENDORS_CREATE)
  create() {
    // Create access for elevated roles only
  }
  
  @Delete(':id')
  @Roles(Role.ADMIN)
  @Scopes(Scope.VENDORS_DELETE)
  remove() {
    // Delete access for admin only
  }
}
```

## Common Authorization Patterns

### CRUD Operations with Type-Safe Enums
```typescript
// Read: Broad access
@Roles(Role.ADMIN, Role.MANAGER, Role.USER)
@Scopes(Scope.VENDORS_READ)

// Create/Update: Elevated access
@Roles(Role.ADMIN, Role.MANAGER)
@Scopes(Scope.VENDORS_CREATE, Scope.VENDORS_UPDATE)

// Delete: Restricted access
@Roles(Role.ADMIN)
@Scopes(Scope.VENDORS_DELETE)
```

### Public Endpoints
Some endpoints should remain public (no guards):
```typescript
@Get('health')
healthCheck() {
  // Public endpoint - no authentication required
}
```

## Role and Scope Management

### Creating Roles with Scopes
```typescript
const adminRole = {
  name: 'admin',
  scopes: [
    'vendors:create', 'vendors:read', 'vendors:update', 'vendors:delete',
    'invoices:create', 'invoices:read', 'invoices:update', 'invoices:delete',
    'users:create', 'users:read', 'users:update', 'users:delete'
  ]
};

const managerRole = {
  name: 'manager',
  scopes: [
    'vendors:create', 'vendors:read', 'vendors:update',
    'invoices:create', 'invoices:read', 'invoices:update'
  ]
};

const userRole = {
  name: 'user',
  scopes: [
    'vendors:read',
    'invoices:read'
  ]
};
```

### Suggested Scope Naming Convention
```
module:action
```

Examples:
- `vendors:create`, `vendors:read`, `vendors:update`, `vendors:delete`
- `invoices:create`, `invoices:read`, `invoices:update`, `invoices:delete`
- `users:manage`, `roles:manage`
- `reports:view`, `analytics:view`

## Security Best Practices

1. **Always use HTTPS** in production
2. **Apply guards at controller level** for broad protection
3. **Use method-level decorators** for specific restrictions  
4. **Principle of least privilege** - give minimum required access
5. **Regular token rotation** - keep JWT expiry reasonable (currently 60m)
6. **Audit access patterns** - monitor who accesses what
7. **Public endpoints** - carefully consider what should be public (health checks, etc.)

## Current Controller Status

✅ **Fully Secured Controllers (JWT + Role + Scope Protection):**
- `auth.controller.ts` - Complete authorization with admin-only access to user/role management
- `vendors.controller.ts` - Role-based access: Admin/Manager can create/update, all can read, admin-only delete
- `tenants.controller.ts` - Admin-only for tenant management, admin/manager for configs
- `invoices.controller.ts` - Finance role included, broad read access, restricted create/update/delete
- `purchase-orders.controller.ts` - Procurement role included, manager approval required
- `sales-orders.controller.ts` - Sales role included, finance role for invoicing
- `app.controller.ts` - JWT protected hello endpoint, public health endpoints

## 🎯 **Authorization Matrix by Role:**

| Role | Scope Access |
|------|-------------|
| **Admin** | All scopes (full system access) |
| **Manager** | Most read/write operations, approval workflows |
| **Finance** | Invoice operations, payment processing |
| **Procurement** | Purchase order management |
| **Sales** | Sales order management, shipping |
| **User** | Read-only access to most resources |
| **Viewer** | Read-only access to specific resources |

## Next Steps

1. **Add role/scope decorators** to other controllers based on business requirements
2. **Create initial roles and scopes** in your database
3. **Assign appropriate roles** to users
4. **Test authorization** with different user roles
5. **Monitor and audit** access patterns