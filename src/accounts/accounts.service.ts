import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Account,
  AccountDocument,
  AccountType,
  DEBIT_NORMAL,
} from './schemas/account.schema';
import { DEFAULT_HOSPITAL_ACCOUNTS, ACCOUNT_CODES } from './accounts.seed';
import { AuditService } from '@audit/audit.service';

export interface BalanceSheetData {
  assets: { accounts: any[]; total: number };
  liabilities: { accounts: any[]; total: number };
  equity: { accounts: any[]; total: number };
  netAssets: number;
}

export interface PnLData {
  period: { from: string; to: string };
  revenue: { accounts: any[]; total: number };
  costOfGoods: { accounts: any[]; total: number };
  grossProfit: number;
  operatingExpenses: { accounts: any[]; total: number };
  operatingProfit: number;
  financeExpenses: { accounts: any[]; total: number };
  netProfit: number;
}

export interface FindAllParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  is_active?: boolean;
}

export interface AgingParams {
  type: 'AR' | 'AP';
  asOf: string;
  page: number;
  limit: number;
}

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    @InjectModel(Account.name)
    private accountModel: Model<AccountDocument>,
    private readonly auditService: AuditService,
  ) {}

  // ── Seeding ────────────────────────────────────────────────────────────

  async seedDefaultAccounts(
    tenantId: string,
    userId = 'system',
  ): Promise<void> {
    const existing = await this.accountModel.countDocuments({ tenantId });
    if (existing > 0) return;

    this.logger.log(
      `Seeding default Chart of Accounts for tenant: ${tenantId}`,
    );
    const docs = DEFAULT_HOSPITAL_ACCOUNTS.map((a) => ({
      account_code: a.code,
      account_name: a.name,
      account_type: a.type as AccountType,
      account_sub_type: a.sub,
      description: a.desc,
      is_system: true,
      balance: 0,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    }));
    await this.accountModel.insertMany(docs);
    this.logger.log(`Seeded ${docs.length} accounts for tenant: ${tenantId}`);
  }

  // ── CRUD ────────────────────────────────────────────────────────────────

  async findAll(
    tenantId: string,
    params: FindAllParams = {},
  ): Promise<{ data: Account[]; total: number; page: number; limit: number }> {
    await this.seedDefaultAccounts(tenantId);

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(Math.max(1, params.limit || 25), 25);
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { tenantId };

    // Filter by is_active (default: show only active)
    if (params.is_active !== undefined) {
      query.is_active = params.is_active;
    } else {
      query.is_active = true;
    }

    // Filter by type
    if (params.type) {
      query.account_type = params.type;
    }

    // Search by name or code
    if (params.search) {
      query.$or = [
        { account_name: { $regex: params.search, $options: 'i' } },
        { account_code: { $regex: params.search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.accountModel
        .find(query)
        .sort({ account_code: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.accountModel.countDocuments(query),
    ]);

    return { data, total, page, limit };
  }

  async getStats(tenantId: string): Promise<Record<string, number>> {
    await this.seedDefaultAccounts(tenantId);
    const results = await this.accountModel.aggregate([
      { $match: { tenantId, is_active: true } },
      {
        $group: {
          _id: '$account_type',
          count: { $sum: 1 },
        },
      },
    ]);

    const counts: Record<string, number> = { total: 0 };
    for (const r of results) {
      counts[r._id] = r.count;
      counts.total = (counts.total || 0) + r.count;
    }
    return counts;
  }

  async findOne(id: string, tenantId: string): Promise<Account> {
    const account = await this.accountModel
      .findOne({ _id: id, tenantId })
      .lean();
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async findByCode(
    tenantId: string,
    code: string,
  ): Promise<AccountDocument | null> {
    await this.seedDefaultAccounts(tenantId);
    return this.accountModel.findOne({ tenantId, account_code: code });
  }

  async findById(id: string): Promise<AccountDocument | null> {
    return this.accountModel.findById(id);
  }

  async create(
    data: Partial<Account> & {
      account_code: string;
      account_name: string;
      account_type: AccountType;
    },
    tenantId: string,
    userId: string,
  ): Promise<Account> {
    // Check for duplicate code within tenant
    const existing = await this.accountModel.findOne({
      tenantId,
      account_code: data.account_code,
    });
    if (existing) {
      throw new BadRequestException(
        `Account with code ${data.account_code} already exists`,
      );
    }

    const doc = new this.accountModel({
      ...data,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });
    const saved = await doc.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'account',
      entityId: saved.id as string,
      newValue: saved.toObject(),
      tenantId,
    });

    return saved;
  }

  async update(
    id: string,
    data: Partial<Account>,
    tenantId: string,
    userId: string,
  ): Promise<Account> {
    const old = await this.accountModel.findOne({ _id: id, tenantId });
    if (!old) throw new NotFoundException('Account not found');

    const updated = await this.accountModel.findByIdAndUpdate(
      id,
      { ...data, updatedBy: userId },
      { new: true },
    );

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'account',
      entityId: id,
      oldValue: old.toObject(),
      newValue: updated?.toObject(),
      tenantId,
    });

    return updated!;
  }

  async delete(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<{ id: string; is_active: boolean }> {
    const account = await this.accountModel.findOne({ _id: id, tenantId });
    if (!account) throw new NotFoundException('Account not found');

    if (account.is_system) {
      throw new BadRequestException(
        'System accounts cannot be deleted',
      );
    }

    // Soft delete — set is_active = false
    await this.accountModel.findByIdAndUpdate(id, {
      is_active: false,
      updatedBy: userId,
    });

    void this.auditService.log({
      userId,
      action: 'delete',
      entity: 'account',
      entityId: id,
      oldValue: account.toObject(),
      tenantId,
    });

    return { id, is_active: false };
  }

  // ── Balance updates ─────────────────────────────────────────────────────

  async adjustBalance(
    tenantId: string,
    accountCode: string,
    debit: number,
    credit: number,
  ): Promise<void> {
    const account = await this.findByCode(tenantId, accountCode);
    if (!account) {
      this.logger.warn(
        `Account ${accountCode} not found for tenant ${tenantId} — skipping balance update`,
      );
      return;
    }
    const isDebitNormal = DEBIT_NORMAL.includes(
      account.account_type as AccountType,
    );
    const delta = isDebitNormal ? debit - credit : credit - debit;
    await this.accountModel.findByIdAndUpdate(account._id, {
      $inc: { balance: delta },
    });
  }

  // ── Financial statements ────────────────────────────────────────────────

  async getBalanceSheet(tenantId: string): Promise<BalanceSheetData> {
    await this.seedDefaultAccounts(tenantId);
    const accounts = await this.accountModel
      .find({ tenantId, is_active: true, balance: { $ne: 0 } })
      .sort({ account_code: 1 })
      .lean();

    const group = (type: AccountType) => {
      const list = accounts.filter((a) => a.account_type === type);
      return {
        accounts: list,
        total: list.reduce((s, a) => s + (a.balance || 0), 0),
      };
    };

    const assets = group(AccountType.ASSET);
    const liabilities = group(AccountType.LIABILITY);
    const equity = group(AccountType.EQUITY);

    return {
      assets,
      liabilities,
      equity,
      netAssets: assets.total - liabilities.total,
    };
  }

  async getProfitAndLoss(
    tenantId: string,
    from?: string,
    to?: string,
  ): Promise<PnLData> {
    await this.seedDefaultAccounts(tenantId);
    const accounts = await this.accountModel
      .find({ tenantId, is_active: true })
      .sort({ account_code: 1 })
      .lean();

    const ofType = (type: AccountType, subTypes?: string[]) =>
      accounts.filter(
        (a) =>
          a.account_type === type &&
          (!subTypes || subTypes.includes(a.account_sub_type || '')),
      );

    const sum = (list: any[]) =>
      list.reduce((s, a) => s + (a.balance || 0), 0);

    const revenueAccounts = ofType(AccountType.REVENUE);
    const cogsAccounts = ofType(AccountType.EXPENSE, ['cost_of_goods']);
    const opexAccounts = ofType(AccountType.EXPENSE, [
      'operating_expense',
      'non_cash_expense',
    ]);
    const financeAccounts = ofType(AccountType.EXPENSE, ['finance_expense']);

    const totalRevenue = sum(revenueAccounts);
    const totalCOGS = sum(cogsAccounts);
    const totalOpex = sum(opexAccounts);
    const totalFinance = sum(financeAccounts);
    const grossProfit = totalRevenue - totalCOGS;
    const operatingProfit = grossProfit - totalOpex;

    return {
      period: {
        from: from || '',
        to: to || new Date().toISOString().split('T')[0],
      },
      revenue: { accounts: revenueAccounts, total: totalRevenue },
      costOfGoods: { accounts: cogsAccounts, total: totalCOGS },
      grossProfit,
      operatingExpenses: { accounts: opexAccounts, total: totalOpex },
      operatingProfit,
      financeExpenses: { accounts: financeAccounts, total: totalFinance },
      netProfit: operatingProfit - totalFinance,
    };
  }

  // ── Aging report ────────────────────────────────────────────────────────

  async getAgingReport(
    tenantId: string,
    params: AgingParams,
  ): Promise<any> {
    // We use the Invoice model which is registered in InvoicesModule.
    // Since we cannot inject it here without circular deps, we use
    // the Mongoose connection directly.
    const InvoiceModel = this.accountModel.db.model('Invoice');

    const asOfDate = new Date(params.asOf);
    const { page, limit, type } = params;
    const skip = (page - 1) * limit;

    // AR: sales-side invoices (SO, diagnostics, admissions) that aren't fully paid
    // AP: purchase-side invoices (PO) that aren't fully paid
    let sourceTypeFilter: Record<string, any>;
    if (type === 'AR') {
      sourceTypeFilter = {
        source_type: { $in: ['sales_order', 'diagnostic', 'admission'] },
      };
    } else {
      sourceTypeFilter = {
        source_type: { $in: ['purchase_order'] },
      };
    }

    const matchFilter = {
      tenantId,
      status: { $nin: ['paid', 'cancelled'] },
      ...sourceTypeFilter,
    };

    const invoices = await InvoiceModel.find(matchFilter)
      .sort({ due_date: 1 })
      .lean()
      .exec();

    // Compute aging buckets
    let current = 0;
    let days1to30 = 0;
    let days31to60 = 0;
    let days61to90 = 0;
    let over90 = 0;
    let totalOutstanding = 0;

    const entries = invoices.map((inv: any) => {
      const outstanding = (inv.amount || 0) - (inv.paid_amount || 0);
      totalOutstanding += outstanding;

      const dueDate = inv.due_date ? new Date(inv.due_date) : new Date(inv.createdAt);
      const daysOverdue = Math.floor(
        (asOfDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      let bucket: string;
      if (daysOverdue <= 0) {
        bucket = 'current';
        current += outstanding;
      } else if (daysOverdue <= 30) {
        bucket = '1-30';
        days1to30 += outstanding;
      } else if (daysOverdue <= 60) {
        bucket = '31-60';
        days31to60 += outstanding;
      } else if (daysOverdue <= 90) {
        bucket = '61-90';
        days61to90 += outstanding;
      } else {
        bucket = '90+';
        over90 += outstanding;
      }

      return {
        invoice_number: inv.invoice_number,
        source_type: inv.source_type,
        source_number: inv.source_number,
        customer_name: inv.customer_name || inv.vendor_name,
        amount: inv.amount,
        paid_amount: inv.paid_amount,
        outstanding,
        due_date: inv.due_date,
        days_overdue: Math.max(0, daysOverdue),
        bucket,
      };
    });

    // Paginate entries
    const totalEntries = entries.length;
    const paginatedEntries = entries.slice(skip, skip + limit);
    const totalPages = Math.ceil(totalEntries / limit);

    return {
      type,
      asOf: params.asOf,
      summary: {
        current,
        days1to30,
        days31to60,
        days61to90,
        over90,
        total: totalOutstanding,
      },
      entries: paginatedEntries,
      total: totalEntries,
      page,
      limit,
      totalPages,
    };
  }

  async getAccountCodes(): Promise<typeof ACCOUNT_CODES> {
    return ACCOUNT_CODES;
  }
}
