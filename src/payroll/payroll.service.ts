import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmployeeSalary, EmployeeSalaryDocument } from './schemas/employee-salary.schema';
import { PayrollRun, PayrollRunDocument } from './schemas/payroll-run.schema';
import { CreateEmployeeSalaryDto } from './dto/create-employee-salary.dto';
import { UpdateEmployeeSalaryDto } from './dto/update-employee-salary.dto';
import { JournalEntriesService } from '../journal-entries/journal-entries.service';
import { AuditService } from '@audit/audit.service';
import { ACCOUNT_CODES } from '../accounts/accounts.seed';

@Injectable()
export class PayrollService {
  constructor(
    @InjectModel(EmployeeSalary.name) private salaryModel: Model<EmployeeSalaryDocument>,
    @InjectModel(PayrollRun.name) private payrollRunModel: Model<PayrollRunDocument>,
    private readonly journalEntriesService: JournalEntriesService,
    private readonly auditService: AuditService,
  ) {}

  // ── Employee salary configs ─────────────────────────────────────────────

  async findAllEmployees(
    tenantId: string,
    params: { page?: number; limit?: number; search?: string } = {},
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(Math.max(1, params.limit || 25), 25);
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { tenantId };
    if (params.search) {
      query.$or = [
        { employee_name: { $regex: params.search, $options: 'i' } },
        { designation: { $regex: params.search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.salaryModel.find(query).sort({ employee_name: 1 }).skip(skip).limit(limit).lean(),
      this.salaryModel.countDocuments(query),
    ]);

    return { data, total, page, limit };
  }

  async createEmployee(dto: CreateEmployeeSalaryDto, tenantId: string, userId: string) {
    const gross = (dto.basic_salary || 0) + (dto.hra || 0) + (dto.special_allowance || 0);
    const deductions = (dto.pf_deduction || 0) + (dto.tax_deduction || 0);
    const netSalary = gross - deductions;

    const doc = new this.salaryModel({
      ...dto,
      net_salary: netSalary,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });
    const saved = await doc.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'employee_salary',
      entityId: saved.id as string,
      newValue: saved.toObject(),
      tenantId,
    });

    return saved;
  }

  async updateEmployee(id: string, dto: UpdateEmployeeSalaryDto, tenantId: string, userId: string) {
    const old = await this.salaryModel.findOne({ _id: id, tenantId });
    if (!old) throw new NotFoundException('Employee salary config not found');

    // Recalculate net salary if components change
    const basic = dto.basic_salary ?? old.basic_salary;
    const hra = dto.hra ?? old.hra;
    const special = dto.special_allowance ?? old.special_allowance;
    const pf = dto.pf_deduction ?? old.pf_deduction;
    const tax = dto.tax_deduction ?? old.tax_deduction;
    const netSalary = basic + hra + special - pf - tax;

    const updated = await this.salaryModel.findByIdAndUpdate(
      id,
      { ...dto, net_salary: netSalary, updatedBy: userId },
      { new: true },
    );

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'employee_salary',
      entityId: id,
      oldValue: old.toObject(),
      newValue: updated?.toObject(),
      tenantId,
    });

    return updated;
  }

  // ── Payroll runs ────────────────────────────────────────────────────────

  async findAllRuns(
    tenantId: string,
    params: { page?: number; limit?: number } = {},
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(Math.max(1, params.limit || 25), 25);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.payrollRunModel
        .find({ tenantId })
        .sort({ payroll_period: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.payrollRunModel.countDocuments({ tenantId }),
    ]);

    return { data, total, page, limit };
  }

  async runPayroll(payrollPeriod: string, tenantId: string, userId: string) {
    // Check if payroll already exists for this period
    const existing = await this.payrollRunModel.findOne({
      tenantId,
      payroll_period: payrollPeriod,
    });
    if (existing) {
      throw new BadRequestException(
        `Payroll for period ${payrollPeriod} already exists`,
      );
    }

    // Get all active salary configs
    const salaryConfigs = await this.salaryModel.find({
      tenantId,
      is_active: true,
    }).lean();

    if (salaryConfigs.length === 0) {
      throw new BadRequestException('No active employee salary configurations found');
    }

    const entries = salaryConfigs.map((config) => {
      const gross = config.basic_salary + config.hra + config.special_allowance;
      const deductions = config.pf_deduction + config.tax_deduction;
      const net = gross - deductions;

      return {
        employee_salary_id: (config as any)._id.toString(),
        employee_name: config.employee_name,
        designation: config.designation,
        gross,
        deductions,
        net,
        paid: false,
      };
    });

    const totalGross = entries.reduce((s, e) => s + e.gross, 0);
    const totalDeductions = entries.reduce((s, e) => s + e.deductions, 0);
    const totalNet = entries.reduce((s, e) => s + e.net, 0);

    const doc = new this.payrollRunModel({
      payroll_period: payrollPeriod,
      run_date: new Date(),
      status: 'draft',
      entries,
      total_gross: totalGross,
      total_deductions: totalDeductions,
      total_net: totalNet,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await doc.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'payroll_run',
      entityId: saved.id as string,
      newValue: saved.toObject(),
      tenantId,
    });

    return saved;
  }

  async processPayroll(id: string, tenantId: string, userId: string) {
    const run = await this.payrollRunModel.findOne({ _id: id, tenantId });
    if (!run) throw new NotFoundException('Payroll run not found');

    if (run.status !== 'draft') {
      throw new BadRequestException('Only draft payroll runs can be processed');
    }

    // Create journal entry: Debit Salaries & Wages (5102), Credit Salaries Payable (2301)
    const je = await this.journalEntriesService.create(
      {
        entry_date: new Date().toISOString().split('T')[0],
        description: `Payroll for period ${run.payroll_period}`,
        reference_type: 'payroll',
        reference_id: id,
        reference_number: `PR-${run.payroll_period}`,
        lines: [
          {
            account_id: '',
            account_code: '5102', // Salaries & Wages
            account_name: 'Salaries & Wages',
            description: `Salary expense for ${run.payroll_period}`,
            debit: run.total_gross,
            credit: 0,
          },
          {
            account_id: '',
            account_code: '2301', // Salaries Payable
            account_name: 'Salaries Payable',
            description: `Salaries payable for ${run.payroll_period}`,
            debit: 0,
            credit: run.total_gross,
          },
        ],
      },
      tenantId,
      userId,
    );

    // Post the journal entry to update account balances
    await this.journalEntriesService.post(
      (je as any)._id?.toString() || (je as any).id,
      tenantId,
      userId,
    );

    run.status = 'processed';
    run.journal_entry_id = (je as any)._id?.toString() || (je as any).id;
    run.updatedBy = userId;
    const updated = await run.save();

    void this.auditService.log({
      userId,
      action: 'process',
      entity: 'payroll_run',
      entityId: id,
      newValue: { status: 'processed', journal_entry_id: run.journal_entry_id },
      tenantId,
    });

    return updated;
  }

  async payPayroll(id: string, tenantId: string, userId: string) {
    const run = await this.payrollRunModel.findOne({ _id: id, tenantId });
    if (!run) throw new NotFoundException('Payroll run not found');

    if (run.status !== 'processed') {
      throw new BadRequestException('Only processed payroll runs can be paid');
    }

    // Create journal entry: Debit Salaries Payable (2301), Credit Cash/Bank (1001)
    const je = await this.journalEntriesService.create(
      {
        entry_date: new Date().toISOString().split('T')[0],
        description: `Salary payment for period ${run.payroll_period}`,
        reference_type: 'payroll_payment',
        reference_id: id,
        reference_number: `PR-PAY-${run.payroll_period}`,
        lines: [
          {
            account_id: '',
            account_code: '2301', // Salaries Payable
            account_name: 'Salaries Payable',
            description: `Clear salaries payable for ${run.payroll_period}`,
            debit: run.total_net,
            credit: 0,
          },
          {
            account_id: '',
            account_code: ACCOUNT_CODES.CASH, // Cash and Bank
            account_name: 'Cash and Bank',
            description: `Salary disbursement for ${run.payroll_period}`,
            debit: 0,
            credit: run.total_net,
          },
        ],
      },
      tenantId,
      userId,
    );

    // Post the journal entry
    await this.journalEntriesService.post(
      (je as any)._id?.toString() || (je as any).id,
      tenantId,
      userId,
    );

    // Mark all entries as paid
    run.entries = run.entries.map((e: any) => ({ ...e, paid: true }));
    run.status = 'paid';
    run.payment_journal_entry_id = (je as any)._id?.toString() || (je as any).id;
    run.updatedBy = userId;
    const updated = await run.save();

    void this.auditService.log({
      userId,
      action: 'pay',
      entity: 'payroll_run',
      entityId: id,
      newValue: { status: 'paid', payment_journal_entry_id: run.payment_journal_entry_id },
      tenantId,
    });

    return updated;
  }
}
