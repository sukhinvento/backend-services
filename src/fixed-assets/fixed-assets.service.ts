import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FixedAsset, FixedAssetDocument } from './schemas/fixed-asset.schema';
import { CreateFixedAssetDto } from './dto/create-fixed-asset.dto';
import { UpdateFixedAssetDto } from './dto/update-fixed-asset.dto';
import { JournalEntriesService } from '../journal-entries/journal-entries.service';
import { AuditService } from '@audit/audit.service';

@Injectable()
export class FixedAssetsService {
  constructor(
    @InjectModel(FixedAsset.name) private assetModel: Model<FixedAssetDocument>,
    private readonly journalEntriesService: JournalEntriesService,
    private readonly auditService: AuditService,
  ) {}

  // ── CRUD ────────────────────────────────────────────────────────────────

  async findAll(
    tenantId: string,
    params: { page?: number; limit?: number; search?: string; status?: string } = {},
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(Math.max(1, params.limit || 25), 25);
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { tenantId };
    if (params.status) query.status = params.status;
    if (params.search) {
      query.$or = [
        { asset_name: { $regex: params.search, $options: 'i' } },
        { asset_code: { $regex: params.search, $options: 'i' } },
        { category: { $regex: params.search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.assetModel.find(query).sort({ asset_code: 1 }).skip(skip).limit(limit).lean(),
      this.assetModel.countDocuments(query),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string) {
    const asset = await this.assetModel.findOne({ _id: id, tenantId }).lean();
    if (!asset) throw new NotFoundException('Fixed asset not found');
    return asset;
  }

  async create(dto: CreateFixedAssetDto, tenantId: string, userId: string) {
    const existing = await this.assetModel.findOne({
      tenantId,
      asset_code: dto.asset_code,
    });
    if (existing) {
      throw new BadRequestException(
        `Asset with code ${dto.asset_code} already exists`,
      );
    }

    const netBookValue = dto.purchase_cost - (dto.salvage_value || 0) > 0
      ? dto.purchase_cost
      : dto.purchase_cost;

    const doc = new this.assetModel({
      ...dto,
      purchase_date: new Date(dto.purchase_date),
      accumulated_depreciation: 0,
      net_book_value: dto.purchase_cost,
      status: 'active',
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await doc.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'fixed_asset',
      entityId: saved.id as string,
      newValue: saved.toObject(),
      tenantId,
    });

    return saved;
  }

  async update(id: string, dto: UpdateFixedAssetDto, tenantId: string, userId: string) {
    const old = await this.assetModel.findOne({ _id: id, tenantId });
    if (!old) throw new NotFoundException('Fixed asset not found');

    const updated = await this.assetModel.findByIdAndUpdate(
      id,
      { ...dto, updatedBy: userId },
      { new: true },
    );

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'fixed_asset',
      entityId: id,
      oldValue: old.toObject(),
      newValue: updated?.toObject(),
      tenantId,
    });

    return updated;
  }

  // ── Depreciation ────────────────────────────────────────────────────────

  /**
   * Compute monthly depreciation for all active assets and create journal entries.
   * Straight-line: (purchase_cost - salvage_value) / useful_life_years / 12
   * WDV: net_book_value * (1 - (salvage_value/purchase_cost)^(1/useful_life_years)) / 12
   */
  async runDepreciation(period: string, tenantId: string, userId: string) {
    const assets = await this.assetModel.find({
      tenantId,
      status: 'active',
    }).lean();

    if (assets.length === 0) {
      throw new BadRequestException('No active assets found for depreciation');
    }

    const depreciationEntries: Array<{
      assetId: string;
      asset_code: string;
      asset_name: string;
      amount: number;
      depreciation_account_code: string;
      accumulated_account_code: string;
    }> = [];

    for (const asset of assets) {
      let monthlyDep: number;

      if (asset.depreciation_method === 'straight_line') {
        const depreciableAmount = asset.purchase_cost - (asset.salvage_value || 0);
        const annualDep = depreciableAmount / asset.useful_life_years;
        monthlyDep = annualDep / 12;
      } else {
        // Written Down Value (WDV) method
        const nbv = asset.net_book_value || asset.purchase_cost;
        const rate = 1 - Math.pow(
          (asset.salvage_value || 1) / asset.purchase_cost,
          1 / asset.useful_life_years,
        );
        monthlyDep = nbv * rate / 12;
      }

      monthlyDep = Math.round(monthlyDep * 100) / 100;

      // Skip if fully depreciated
      const remainingValue = asset.net_book_value - monthlyDep;
      if (remainingValue < (asset.salvage_value || 0)) {
        monthlyDep = Math.max(0, asset.net_book_value - (asset.salvage_value || 0));
      }

      if (monthlyDep <= 0) continue;

      depreciationEntries.push({
        assetId: (asset as any)._id.toString(),
        asset_code: asset.asset_code,
        asset_name: asset.asset_name,
        amount: monthlyDep,
        // Default depreciation account codes from the CoA seed
        depreciation_account_code: '5301', // Depreciation — Medical Equipment
        accumulated_account_code: '1601', // Accumulated Depreciation — Equipment
      });
    }

    if (depreciationEntries.length === 0) {
      return { message: 'No depreciation to record — all assets fully depreciated', entries: [] };
    }

    const totalDepreciation = depreciationEntries.reduce((s, e) => s + e.amount, 0);

    // Create a single journal entry for all depreciation
    const je = await this.journalEntriesService.create(
      {
        entry_date: new Date().toISOString().split('T')[0],
        description: `Monthly depreciation for period ${period}`,
        reference_type: 'depreciation',
        reference_number: `DEP-${period}`,
        lines: [
          {
            account_id: '',
            account_code: '5301',
            account_name: 'Depreciation — Medical Equipment',
            description: `Depreciation expense for ${period}`,
            debit: totalDepreciation,
            credit: 0,
          },
          {
            account_id: '',
            account_code: '1601',
            account_name: 'Accumulated Depreciation — Equipment',
            description: `Accumulated depreciation for ${period}`,
            debit: 0,
            credit: totalDepreciation,
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

    // Update each asset's accumulated_depreciation and net_book_value
    for (const entry of depreciationEntries) {
      const asset = await this.assetModel.findById(entry.assetId);
      if (!asset) continue;

      asset.accumulated_depreciation += entry.amount;
      asset.net_book_value = asset.purchase_cost - asset.accumulated_depreciation;

      if (asset.net_book_value <= (asset.salvage_value || 0)) {
        asset.status = 'fully_depreciated';
        asset.net_book_value = asset.salvage_value || 0;
      }

      asset.updatedBy = userId;
      await asset.save();
    }

    return {
      period,
      totalDepreciation,
      assetsProcessed: depreciationEntries.length,
      journalEntryId: (je as any)._id?.toString() || (je as any).id,
      entries: depreciationEntries,
    };
  }

  // ── Depreciation schedule for a single asset ────────────────────────────

  async getDepreciationSchedule(id: string, tenantId: string) {
    const asset = await this.assetModel.findOne({ _id: id, tenantId }).lean();
    if (!asset) throw new NotFoundException('Fixed asset not found');

    const schedule: Array<{
      year: number;
      month: number;
      opening_nbv: number;
      depreciation: number;
      closing_nbv: number;
    }> = [];

    const depreciableAmount = asset.purchase_cost - (asset.salvage_value || 0);
    let nbv = asset.purchase_cost;
    const startDate = new Date(asset.purchase_date);
    const totalMonths = asset.useful_life_years * 12;

    for (let m = 0; m < totalMonths; m++) {
      const year = startDate.getFullYear() + Math.floor((startDate.getMonth() + m) / 12);
      const month = ((startDate.getMonth() + m) % 12) + 1;

      let monthlyDep: number;
      if (asset.depreciation_method === 'straight_line') {
        monthlyDep = depreciableAmount / totalMonths;
      } else {
        const rate = 1 - Math.pow(
          (asset.salvage_value || 1) / asset.purchase_cost,
          1 / asset.useful_life_years,
        );
        monthlyDep = nbv * rate / 12;
      }

      monthlyDep = Math.round(monthlyDep * 100) / 100;

      // Cap at remaining depreciable value
      if (nbv - monthlyDep < (asset.salvage_value || 0)) {
        monthlyDep = Math.max(0, nbv - (asset.salvage_value || 0));
      }

      if (monthlyDep <= 0) break;

      schedule.push({
        year,
        month,
        opening_nbv: Math.round(nbv * 100) / 100,
        depreciation: monthlyDep,
        closing_nbv: Math.round((nbv - monthlyDep) * 100) / 100,
      });

      nbv -= monthlyDep;
    }

    return {
      asset_code: asset.asset_code,
      asset_name: asset.asset_name,
      purchase_cost: asset.purchase_cost,
      salvage_value: asset.salvage_value,
      useful_life_years: asset.useful_life_years,
      depreciation_method: asset.depreciation_method,
      current_accumulated_depreciation: asset.accumulated_depreciation,
      current_net_book_value: asset.net_book_value,
      schedule,
    };
  }
}
