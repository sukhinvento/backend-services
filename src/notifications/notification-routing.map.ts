import { Scope } from '@common/enums/scopes.enum';
import { NotificationCategory } from './schemas/notification-preference.schema';

/**
 * Maps each notification category to the set of scopes whose users
 * should receive that notification.
 *
 * Admin users (role = 'admin') always receive everything regardless of scope.
 * Approval-required events (purchase_order pending_approval) additionally
 * target admins+managers explicitly.
 */
export const CATEGORY_SCOPE_MAP: Record<NotificationCategory, Scope[]> = {
  system: [],                                     // broadcast — handled separately

  inventory: [Scope.INVENTORY],
  stock_transfer: [Scope.INVENTORY],

  purchase_order: [Scope.PURCHASE_ORDERS],
  sales_order: [Scope.SALES_ORDERS],

  patient: [Scope.PATIENTS, Scope.ADMISSIONS, Scope.DOCTORS],
  admission: [Scope.ADMISSIONS, Scope.PATIENTS, Scope.DOCTORS, Scope.ROOMS],
  diagnostic: [Scope.DIAGNOSTICS, Scope.PATIENTS, Scope.DOCTORS],

  billing: [Scope.INVOICES],
  invoice: [Scope.INVOICES, Scope.PURCHASE_ORDERS, Scope.SALES_ORDERS],

  vendor: [Scope.VENDORS, Scope.PURCHASE_ORDERS],
  doctor: [Scope.DOCTORS, Scope.ADMISSIONS, Scope.PATIENTS],
  opd_visit: [Scope.PATIENTS, Scope.DOCTORS, Scope.ADMISSIONS],
};

/**
 * Event types that require an approval action.
 * These always also target admin and manager users.
 */
export const APPROVAL_EVENT_TYPES = new Set([
  'purchase_order.pending_approval',
  'purchase_order.approved',
  'purchase_order.rejected',
  'sales_order.pending_approval',
  'admission.pending_approval',
]);

/**
 * Maps a Kafka eventType string to a NotificationCategory.
 */
export function eventTypeToCategory(eventType: string): NotificationCategory {
  const prefix = eventType.split('.')[0];
  const map: Record<string, NotificationCategory> = {
    purchase_order:  'purchase_order',
    sales_order:     'sales_order',
    patient:         'patient',
    diagnostic:      'diagnostic',
    admission:       'admission',
    doctor:          'doctor',
    inventory:       'inventory',
    stock_transfer:  'stock_transfer',
    hospital_bill:   'billing',
    invoice:         'invoice',
    vendor:          'vendor',
    opd_visit:       'opd_visit',
    system:          'system',
  };
  return map[prefix] ?? 'system';
}
