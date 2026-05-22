import { Role } from '../enums/roles.enum';
import { Scope } from '../enums/scopes.enum';

/**
 * Maps each Role to its default allowed Scopes.
 * Controllers use @Roles() + @Scopes() decorators for per-endpoint enforcement,
 * but this matrix defines the defaults for the seed script and UI permission display.
 */
export const ROLE_DEFAULT_SCOPES: Record<Role, Scope[]> = {
  [Role.ADMIN]: Object.values(Scope), // all scopes
  [Role.MANAGER]: [
    Scope.VENDORS,
    Scope.PURCHASE_ORDERS,
    Scope.SALES_ORDERS,
    Scope.INVOICES,
    Scope.PATIENTS,
    Scope.DOCTORS,
    Scope.ROOMS,
    Scope.ADMISSIONS,
    Scope.DIAGNOSTICS,
    Scope.MEDICATIONS,
    Scope.HOSPITAL_BILLING,
    Scope.INVENTORY,
  ],
  [Role.USER]: [
    Scope.PURCHASE_ORDERS,
    Scope.SALES_ORDERS,
    Scope.PATIENTS,
    Scope.DIAGNOSTICS,
  ],
  [Role.VIEWER]: [
    Scope.PURCHASE_ORDERS,
    Scope.SALES_ORDERS,
    Scope.PATIENTS,
  ],
  [Role.DOCTOR]: [
    Scope.PATIENTS,
    Scope.ADMISSIONS,
    Scope.DIAGNOSTICS,
    Scope.MEDICATIONS,
  ],
  [Role.NURSE]: [
    Scope.PATIENTS,
    Scope.ADMISSIONS,
    Scope.MEDICATIONS,
  ],
  [Role.RECEPTIONIST]: [
    Scope.PATIENTS,
    Scope.ADMISSIONS,
    Scope.ROOMS,
  ],
  [Role.BILLING_STAFF]: [
    Scope.HOSPITAL_BILLING,
    Scope.INVOICES,
    Scope.PATIENTS,
  ],
  [Role.LAB_TECHNICIAN]: [
    Scope.DIAGNOSTICS,
    Scope.PATIENTS,
  ],
  [Role.PHARMACIST]: [
    Scope.MEDICATIONS,
    Scope.INVENTORY,
    Scope.PATIENTS,
  ],
};
