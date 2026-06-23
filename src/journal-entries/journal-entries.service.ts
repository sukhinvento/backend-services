import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  JournalEntry,
  JournalEntryDocument,
} from './schemas/journal-entry.schema';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { AccountsService } from '../accounts/accounts.service';
import { AuditService } from '@audit/audit.service';

export interface JEFindAllParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class JournalEntriesService {
  private readonly logger = new Logger(JournalEntriesService.name);

  constructor(
    @InjectModel(JournalEntry.name)
    private jeModel: Model<JournalEntryDocument>,
    private readonly accountsService: AccountsService,
    private readonly auditService: AuditService,
  ) {}

  // ── Helpers ─────────────────────────────────────────────────────────────

  /** Generate next entry_number: JE-YYYYMM-NNN */
  private async generateEntryNumber(tenantId: string): Promise<string> {
    const now = new Date();
    const yyyyMm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `JE-${yyyyMm}-`;

    const last = await this.jeModel
      .findOne({ tenantId, entry_number: { $regex: `^${prefix}` } })
      .sort({ entry_number: -1 })
      .lean();

    let seq = 1;
    if (last) {
      const lastSeq = parseInt(last.entry_number.split('-').pop() || '0', 10);
      seq = lastSeq + 1;
    }
    return `${prefix}${String(seq).padStart(3, '0')}`;
  }

  // ── CRUD ────────────────────────────────────────────────────────────────

  async findAll(
    tenantId: string,
    params: JEFindAllParams = {},
  ): Promise<{
    data: JournalEntry[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(Math.max(1, params.limit || 25), 25);
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { tenantId };

    if (params.status) {
      query.status = params.status;
    }
    if (params.search) {
      query.$or = [
        { entry_number: { $regex: params.search, $options: 'i' } },
        { description: { $regex: params.search, $options: 'i' } },
        { reference_number: { $regex: params.search, $options: 'i' } },
      ];
    }
    if (params.dateFrom || params.dateTo) {
      query.entry_date = {};
      if (params.dateFrom) query.entry_date.$gte = new Date(params.dateFrom);
      if (params.dateTo) query.entry_date.$lte = new Date(params.dateTo);
    }

    const [data, total] = await Promise.all([
      this.jeModel
        .find(query)
        .sort({ entry_date: -1, entry_number: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.jeModel.countDocuments(query),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<JournalEntry> {
    const entry = await this.jeModel
      .findOne({ _id: id, tenantId })
      .lean();
    if (!entry) throw new NotFoundException('Journal entry not found');
    return entry;
  }

  async create(
    dto: CreateJournalEntryDto,
    tenantId: string,
    userId: string,
  ): Promise<JournalEntry> {
    // Validate: total debits must equal total credits
    const totalDebit = dto.lines.reduce((s, l) => s + (l.debit || 0), 0);
    const totalCredit = dto.lines.reduce((s, l) => s + (l.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `Total debits (${totalDebit}) must equal total credits (${totalCredit})`,
      );
    }

    // Validate: each line must have either debit > 0 or credit > 0, not both
    for (const line of dto.lines) {
      if (line.debit > 0 && line.credit > 0) {
        throw new BadRequestException(
          `Line for account ${line.account_code} cannot have both debit and credit > 0`,
        );
      }
      if (line.debit === 0 && line.credit === 0) {
        throw new BadRequestException(
          `Line for account ${line.account_code} must have either debit or credit > 0`,
        );
      }
    }

    const entryNumber = await this.generateEntryNumber(tenantId);

    const doc = new this.jeModel({
      entry_number: entryNumber,
      entry_date: new Date(dto.entry_date),
      description: dto.description,
      reference_type: dto.reference_type,
      reference_id: dto.reference_id,
      reference_number: dto.reference_number,
      lines: dto.lines,
      total_debit: totalDebit,
      total_credit: totalCredit,
      status: 'draft',
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await doc.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'journal_entry',
      entityId: saved.id as string,
      newValue: saved.toObject(),
      tenantId,
    });

    return saved;
  }

  // ── Post to ledger ──────────────────────────────────────────────────────

  async post(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<JournalEntry> {
    const entry = await this.jeModel.findOne({ _id: id, tenantId });
    if (!entry) throw new NotFoundException('Journal entry not found');

    if (entry.status === 'posted') {
      throw new BadRequestException('Entry is already posted');
    }
    if (entry.status === 'reversed') {
      throw new BadRequestException('Cannot post a reversed entry');
    }

    // Atomically adjust each account balance
    for (const line of entry.lines) {
      await this.accountsService.adjustBalance(
        tenantId,
        line.account_code,
        line.debit || 0,
        line.credit || 0,
      );
    }

    entry.status = 'posted';
    entry.updatedBy = userId;
    const updated = await entry.save();

    void this.auditService.log({
      userId,
      action: 'post',
      entity: 'journal_entry',
      entityId: id,
      newValue: updated.toObject(),
      tenantId,
    });

    return updated;
  }

  // ── Reverse ─────────────────────────────────────────────────────────────

  async reverse(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<JournalEntry> {
    const original = await this.jeModel.findOne({ _id: id, tenantId });
    if (!original) throw new NotFoundException('Journal entry not found');

    if (original.status !== 'posted') {
      throw new BadRequestException(
        'Only posted entries can be reversed',
      );
    }

    // Create reversal entry with swapped debits/credits
    const reversalLines = original.lines.map((line) => ({
      account_id: line.account_id,
      account_code: line.account_code,
      account_name: line.account_name,
      description: `Reversal: ${line.description || ''}`,
      debit: line.credit || 0,
      credit: line.debit || 0,
    }));

    const reversalNumber = await this.generateEntryNumber(tenantId);

    const reversal = new this.jeModel({
      entry_number: reversalNumber,
      entry_date: new Date(),
      description: `Reversal of ${original.entry_number}: ${original.description}`,
      reference_type: original.reference_type,
      reference_id: original.reference_id,
      reference_number: original.reference_number,
      lines: reversalLines,
      total_debit: original.total_credit,
      total_credit: original.total_debit,
      status: 'posted',
      reversal_of: id,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });

    const savedReversal = await reversal.save();

    // Adjust account balances back (the reversal lines swap debit/credit)
    for (const line of reversalLines) {
      await this.accountsService.adjustBalance(
        tenantId,
        line.account_code,
        line.debit,
        line.credit,
      );
    }

    // Mark original as reversed
    original.status = 'reversed';
    original.updatedBy = userId;
    await original.save();

    void this.auditService.log({
      userId,
      action: 'reverse',
      entity: 'journal_entry',
      entityId: id,
      oldValue: { status: 'posted' },
      newValue: {
        status: 'reversed',
        reversal_entry: savedReversal.id,
      },
      tenantId,
    });

    return savedReversal;
  }

  // ── Delete (draft only) ─────────────────────────────────────────────────

  async delete(
    id: string,
    tenantId: string,
  ): Promise<{ id: string; deleted: boolean }> {
    const entry = await this.jeModel.findOne({ _id: id, tenantId });
    if (!entry) throw new NotFoundException('Journal entry not found');

    if (entry.status !== 'draft') {
      throw new BadRequestException(
        'Only draft entries can be deleted',
      );
    }

    await this.jeModel.deleteOne({ _id: id, tenantId });
    return { id, deleted: true };
  }
}
