/**
 * System roles enum
 * Defines hierarchical roles in the system
 */
export enum Role {
  // Existing roles
  ADMIN = 'admin', // Full system access with all modules and user management
  MANAGER = 'manager', // Access to business modules but limited user management
  USER = 'user', // Basic access to assigned modules
  VIEWER = 'viewer', // Read-only access to assigned modules

  // Healthcare roles
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  RECEPTIONIST = 'receptionist',
  BILLING_STAFF = 'billing_staff',
  LAB_TECHNICIAN = 'lab_technician',
  PHARMACIST = 'pharmacist',
}
