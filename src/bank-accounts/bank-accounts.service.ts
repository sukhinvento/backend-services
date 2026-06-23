import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BankAccount, BankAccountDocument } from './schemas/bank-account.schema';
import { BankTransaction, BankTransactionDocument } from './schemas/bank-transaction.schema';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { CreateBankTransactionDto } from './dto/create-bank-transaction.dto';
import { AuditService } from '@audit/audit.service';

@Injectable()
export class BankAccountsService {
  constructor(
    @InjectModel(BankAccount.name) private bankAccountModel: Model<BankAccountDocument>,
    @InjectModel(BankTransaction.name) private bankTxnModel: Model<BankTransactionDocument>,
    private readonly auditService: AuditService,
  ) {}

  // ── Bank Accounts CRUD ──────────────────────────────────────────────────

  async findAll(
    tenantId: string,
    params: { page?: number; limit?: number; search?: string } = {},
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(Math.max(1, params.limit || 25), 25);
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { tenantId, is_active: true };
    if (params.search) {
      query.$or = [
        { bank_name: { $regex: params.search, $options: 'i' } },
        { account_number: { $regex: params.search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.bankAccountModel.find(query).sort({ bank_name: 1 }).skip(skip).limit(limit).lean(),
      this.bankAccountModel.countDocuments(query),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string) {
    const account = await this.bankAccountModel.findOne({ _id: id, tenantId }).lean();
    if (!account) throw new NotFoundException('Bank account not found');
    return account;
  }

  async create(dto: CreateBankAccountDto, tenantId: string, userId: string) {
    // Check duplicate account_number within tenant
    const existing = await this.bankAccountModel.findOne({
      tenantId,
      account_number: dto.account_number,
    });
    if (existing) {
      throw new BadRequestException(
        `Bank account with number ${dto.account_number} already exists`,
      );
    }

    const doc = new this.bankAccountModel({
      ...dto,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });
    const saved = await doc.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'bank_account',
      entityId: saved.id as string,
      newValue: saved.toObject(),
      tenantId,
    });

    return saved;
  }

  async update(id: string, dto: UpdateBankAccountDto, tenantId: string, userId: string) {
    const old = await this.bankAccountModel.findOne({ _id: id, tenantId });
    if (!old) throw new NotFoundException('Bank account not found');

    const updated = await this.bankAccountModel.findByIdAndUpdate(
      id,
      { ...dto, updatedBy: userId },
      { new: true },
    );

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'bank_account',
      entityId: id,
      oldValue: old.toObject(),
      newValue: updated?.toObject(),
      tenantId,
    });

    return updated;
  }

  // ── Transactions ────────────────────────────────────────────────────────

  async getTransactions(
    bankAccountId: string,
    tenantId: string,
    params: { page?: number; limit?: number } = {},
  ) {
    // Verify bank account exists and belongs to tenant
    const account = await this.bankAccountModel.findOne({ _id: bankAccountId, tenantId });
    if (!account) throw new NotFoundException('Bank account not found');

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(Math.max(1, params.limit || 25), 25);
    const skip = (page - 1) * limit;

    const query = { bank_account_id: bankAccountId, tenantId };

    const [data, total] = await Promise.all([
      this.bankTxnModel
        .find(query)
        .sort({ transaction_date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.bankTxnModel.countDocuments(query),
    ]);

    return { data, total, page, limit };
  }

  async createTransaction(
    bankAccountId: string,
    dto: CreateBankTransactionDto,
    tenantId: string,
    userId: string,
  ) {
    const account = await this.bankAccountModel.findOne({ _id: bankAccountId, tenantId });
    if (!account) throw new NotFoundException('Bank account not found');

    // Calculate new running balance
    const runningBalance = account.balance + (dto.credit || 0) - (dto.debit || 0);

    const txn = new this.bankTxnModel({
      bank_account_id: bankAccountId,
      transaction_date: new Date(dto.transaction_date),
      description: dto.description,
      reference_number: dto.reference_number,
      debit: dto.debit || 0,
      credit: dto.credit || 0,
      running_balance: runningBalance,
      journal_entry_id: dto.journal_entry_id,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await txn.save();

    // Update bank account balance
    await this.bankAccountModel.findByIdAndUpdate(bankAccountId, {
      balance: runningBalance,
      updatedBy: userId,
    });

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'bank_transaction',
      entityId: saved.id as string,
      newValue: saved.toObject(),
      tenantId,
    });

    return saved;
  }

  async reconcileTransaction(
    bankAccountId: string,
    txnId: string,
    tenantId: string,
    userId: string,
  ) {
    const account = await this.bankAccountModel.findOne({ _id: bankAccountId, tenantId });
    if (!account) throw new NotFoundException('Bank account not found');

    const txn = await this.bankTxnModel.findOne({
      _id: txnId,
      bank_account_id: bankAccountId,
      tenantId,
    });
    if (!txn) throw new NotFoundException('Transaction not found');

    if (txn.is_reconciled) {
      throw new BadRequestException('Transaction is already reconciled');
    }

    txn.is_reconciled = true;
    txn.reconciled_date = new Date();
    txn.updatedBy = userId;
    const updated = await txn.save();

    void this.auditService.log({
      userId,
      action: 'reconcile',
      entity: 'bank_transaction',
      entityId: txnId,
      newValue: { is_reconciled: true, reconciled_date: updated.reconciled_date },
      tenantId,
    });

    return updated;
  }
}
