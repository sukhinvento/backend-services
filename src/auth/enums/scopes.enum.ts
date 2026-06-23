/**
 * System scopes enum
 * Defines module-based permissions for different areas of the system
 */
export enum Scope {
  // Module permissions - grants access to entire module
  VENDORS = 'vendors',
  TENANTS = 'tenants',
  INVOICES = 'invoices',
  PURCHASE_ORDERS = 'purchase-orders',
  SALES_ORDERS = 'sales-orders',

  // User and role management
  USER_MANAGEMENT = 'user-management',

  // System level access
  SYSTEM_ADMIN = 'system-admin',

  // Finance scopes
  FINANCE = 'finance',

  // Healthcare scopes
  PATIENTS = 'patients',
  DOCTORS = 'doctors',
  ROOMS = 'rooms',
  ADMISSIONS = 'admissions',
  DIAGNOSTICS = 'diagnostics',
  MEDICATIONS = 'medications',
  INVENTORY = 'inventory',
  LOCATIONS = 'locations',
}
