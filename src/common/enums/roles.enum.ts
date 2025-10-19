/**
 * System roles enum
 * Defines hierarchical roles in the system
 */
export enum Role {
  ADMIN = 'admin', // Full system access with all modules and user management
  MANAGER = 'manager', // Access to business modules but limited user management
  USER = 'user', // Basic access to assigned modules
  VIEWER = 'viewer', // Read-only access to assigned modules
}
