/**
 * Default hospital Chart of Accounts.
 * These are seeded once per tenant on first access.
 *
 * Account code convention:
 *   1xxx = Assets       (normal: Debit)
 *   2xxx = Liabilities  (normal: Credit)
 *   3xxx = Equity       (normal: Credit)
 *   4xxx = Revenue      (normal: Credit)
 *   5xxx = Expenses     (normal: Debit)
 */

export const DEFAULT_HOSPITAL_ACCOUNTS = [
  // ── ASSETS ──────────────────────────────────────────────────────────────
  { code: '1001', name: 'Cash and Bank',                       type: 'asset',     sub: 'current_asset',       desc: 'Cash on hand and bank balances' },
  { code: '1101', name: 'Accounts Receivable',                 type: 'asset',     sub: 'current_asset',       desc: 'Amounts owed by patients and customers (SO, diagnostics, admissions)' },
  { code: '1102', name: 'Input Tax Credit Receivable (GST)',   type: 'asset',     sub: 'current_asset',       desc: 'GST paid on purchases (CGST+SGST+IGST) claimable as ITC' },
  { code: '1201', name: 'Medical Supplies & Inventory',        type: 'asset',     sub: 'current_asset',       desc: 'Medicines, surgical consumables, reagents' },
  { code: '1301', name: 'Prepaid Expenses',                    type: 'asset',     sub: 'current_asset',       desc: 'Advance payments for insurance, rent, etc.' },
  { code: '1501', name: 'Medical Equipment',                   type: 'asset',     sub: 'fixed_asset',         desc: 'Diagnostic machines, surgical instruments, ICU equipment' },
  { code: '1502', name: 'Furniture & Fixtures',                type: 'asset',     sub: 'fixed_asset',         desc: 'Hospital beds, chairs, almirahs' },
  { code: '1503', name: 'Vehicles',                            type: 'asset',     sub: 'fixed_asset',         desc: 'Ambulances and hospital transport' },
  { code: '1504', name: 'Building & Infrastructure',           type: 'asset',     sub: 'fixed_asset',         desc: 'Hospital building and civil infrastructure' },
  { code: '1601', name: 'Accumulated Depreciation — Equipment', type: 'asset',    sub: 'contra_asset',        desc: 'Contra-asset: accumulated depreciation on medical equipment' },
  { code: '1602', name: 'Accumulated Depreciation — Building', type: 'asset',     sub: 'contra_asset',        desc: 'Contra-asset: accumulated depreciation on building' },

  // ── LIABILITIES ─────────────────────────────────────────────────────────
  { code: '2001', name: 'Accounts Payable',                    type: 'liability', sub: 'current_liability',   desc: 'Amounts owed to vendors and suppliers (PO invoices)' },
  { code: '2101', name: 'CGST Payable',                        type: 'liability', sub: 'tax_liability',       desc: 'Central GST collected on sales — payable to government' },
  { code: '2102', name: 'SGST Payable',                        type: 'liability', sub: 'tax_liability',       desc: 'State GST collected on sales — payable to state' },
  { code: '2103', name: 'IGST Payable',                        type: 'liability', sub: 'tax_liability',       desc: 'Integrated GST collected on inter-state sales' },
  { code: '2201', name: 'Deferred Revenue',                    type: 'liability', sub: 'current_liability',   desc: 'Advance payments received from patients' },
  { code: '2301', name: 'Salaries Payable',                    type: 'liability', sub: 'current_liability',   desc: 'Salaries accrued but not yet paid' },
  { code: '2501', name: 'Bank Loans',                          type: 'liability', sub: 'long_term_liability',  desc: 'Long-term borrowings' },
  { code: '2502', name: 'Equipment Finance',                   type: 'liability', sub: 'long_term_liability',  desc: 'Finance lease liabilities for medical equipment' },

  // ── EQUITY ──────────────────────────────────────────────────────────────
  { code: '3001', name: "Owner's / Promoter Capital",          type: 'equity',    sub: 'paid_in_capital',     desc: 'Equity capital contributed by owners' },
  { code: '3101', name: 'Retained Earnings',                   type: 'equity',    sub: 'retained_earnings',   desc: 'Accumulated profits retained in the business' },
  { code: '3201', name: 'Current Year Profit / Loss',          type: 'equity',    sub: 'retained_earnings',   desc: 'Net income for the current financial year (auto-computed)' },

  // ── REVENUE ─────────────────────────────────────────────────────────────
  { code: '4001', name: 'OPD Consultation Revenue',            type: 'revenue',   sub: 'operating_revenue',   desc: 'Revenue from out-patient consultations and visits' },
  { code: '4002', name: 'IPD / Admission Revenue',             type: 'revenue',   sub: 'operating_revenue',   desc: 'Room charges, nursing charges from admitted patients' },
  { code: '4003', name: 'Diagnostic & Lab Revenue',            type: 'revenue',   sub: 'operating_revenue',   desc: 'Pathology, radiology, blood tests, imaging' },
  { code: '4004', name: 'Pharmacy & Medicine Sales',           type: 'revenue',   sub: 'operating_revenue',   desc: 'Revenue from medicine retail and dispensary' },
  { code: '4005', name: 'Surgical & Procedure Revenue',        type: 'revenue',   sub: 'operating_revenue',   desc: 'Operation theatre charges, procedure fees' },
  { code: '4006', name: 'Ambulance & Transport Revenue',       type: 'revenue',   sub: 'operating_revenue',   desc: 'Revenue from ambulance and patient transport' },
  { code: '4099', name: 'Other Medical Revenue',               type: 'revenue',   sub: 'other_revenue',       desc: 'Miscellaneous revenue not classified above' },

  // ── EXPENSES ────────────────────────────────────────────────────────────
  { code: '5001', name: 'Medical Supplies (COGS)',              type: 'expense',   sub: 'cost_of_goods',       desc: 'Cost of consumables, reagents, surgical supplies used' },
  { code: '5002', name: 'Medicines & Pharmaceuticals (COGS)',   type: 'expense',   sub: 'cost_of_goods',       desc: 'Cost of medicines dispensed to patients' },
  { code: '5101', name: 'Doctor Consultation Fees',             type: 'expense',   sub: 'operating_expense',   desc: 'Fees paid to visiting/consulting doctors' },
  { code: '5102', name: 'Salaries & Wages',                     type: 'expense',   sub: 'operating_expense',   desc: 'Employee salaries — nursing, administrative, support staff' },
  { code: '5103', name: 'Contract Labour',                      type: 'expense',   sub: 'operating_expense',   desc: 'Housekeeping, security, canteen outsourcing' },
  { code: '5201', name: 'Rent & Facility Charges',              type: 'expense',   sub: 'operating_expense',   desc: 'Building rent, AMC contracts' },
  { code: '5202', name: 'Power & Utilities',                    type: 'expense',   sub: 'operating_expense',   desc: 'Electricity, water, generator costs' },
  { code: '5203', name: 'Repairs & Maintenance',                type: 'expense',   sub: 'operating_expense',   desc: 'Equipment maintenance, civil repairs' },
  { code: '5301', name: 'Depreciation — Medical Equipment',     type: 'expense',   sub: 'non_cash_expense',    desc: 'Annual depreciation charge on medical equipment' },
  { code: '5302', name: 'Depreciation — Building & Fixtures',   type: 'expense',   sub: 'non_cash_expense',    desc: 'Annual depreciation on building and furniture' },
  { code: '5401', name: 'Finance Charges & Interest',           type: 'expense',   sub: 'finance_expense',     desc: 'Bank interest, loan charges, LC/BG charges' },
  { code: '5501', name: 'Insurance Premiums',                   type: 'expense',   sub: 'operating_expense',   desc: 'Medical indemnity, property, vehicle insurance' },
  { code: '5601', name: 'Marketing & Patient Acquisition',      type: 'expense',   sub: 'operating_expense',   desc: 'Advertising, health camps, digital marketing' },
  { code: '5901', name: 'Other Operating Expenses',             type: 'expense',   sub: 'operating_expense',   desc: 'Miscellaneous expenses not classified above' },
];

// ── Lookup helpers used by journal-entry auto-posting ──────────────────────
export const ACCOUNT_CODES = {
  CASH:              '1001',
  AR:                '1101',   // Accounts Receivable
  ITC:               '1102',   // Input Tax Credit Receivable
  INVENTORY:         '1201',   // Medical Supplies
  AP:                '2001',   // Accounts Payable
  CGST_PAYABLE:      '2101',
  SGST_PAYABLE:      '2102',
  IGST_PAYABLE:      '2103',
  REVENUE_OPD:       '4001',
  REVENUE_IPD:       '4002',
  REVENUE_DIAGNOSTIC:'4003',
  REVENUE_PHARMACY:  '4004',
  REVENUE_OTHER:     '4099',
  COGS_SUPPLIES:     '5001',
  COGS_MEDICINES:    '5002',
};
