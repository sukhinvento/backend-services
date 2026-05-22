import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto';
import { UpdateStockTransferDto } from './dto/update-stock-transfer.dto';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { UpdateStockAdjustmentDto } from './dto/update-stock-adjustment.dto';
import { StockTransfer, StockTransferDocument } from './schemas/stock-transfer.schema';
import { StockAdjustment, StockAdjustmentDocument } from './schemas/stock-adjustment.schema';
import { TenantsService } from '@tenants/tenants.service';
import { AuditService } from '@audit/audit.service';
import { QueryDto } from '@common/dto/query.dto';
import { QueryBuilderService } from '@common/services/query-builder.service';

@Injectable()
export class StockService {
  constructor(
    @InjectModel(StockTransfer.name) private stockTransferModel: Model<StockTransferDocument>,
    @InjectModel(StockAdjustment.name) private stockAdjustmentModel: Model<StockAdjustmentDocument>,
    private readonly tenantsService: TenantsService,
    private readonly auditService: AuditService,
    private readonly queryBuilder: QueryBuilderService<any>,
  ) {}

  // ─── Stock Transfer Methods ────────────────────────────────────────────────

  async createTransfer(dto: CreateStockTransferDto, userId: string, tenantId: string) {
    const fieldConfigs = await this.tenantsService.getFieldConfiguration(tenantId, 'stock_transfer');
    for (const fieldConfig of fieldConfigs) {
      if (fieldConfig.required && !dto.custom_fields?.[fieldConfig.field_id]) {
        throw new BadRequestException(`${fieldConfig.label} is required.`);
      }
    }

    const transfer_number = dto.transfer_number || `TRF-${tenantId.toUpperCase().slice(0, 6)}-${Date.now()}`;

    const newTransfer = new this.stockTransferModel({
      ...dto,
      transfer_number,
      status: dto.status || 'draft',
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });
    const saved = await newTransfer.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'stock_transfer',
      entityId: saved.id as string,
      newValue: saved.toObject(),
      tenantId,
    });

    return saved;
  }

  async listTransfers(query: QueryDto, tenantId: string) {
    const filter = { ...(query.filter || {}), tenantId };
    return this.queryBuilder
      .buildQuery(this.stockTransferModel, { ...query, filter })
      .exec();
  }

  async findOneTransfer(id: string, tenantId: string) {
    const transfer = await this.stockTransferModel.findOne({ _id: id, tenantId }).exec();
    if (!transfer) throw new NotFoundException(`Stock transfer ${id} not found`);
    return transfer;
  }

  async updateTransfer(id: string, dto: UpdateStockTransferDto, userId: string, tenantId: string) {
    await this.findOneTransfer(id, tenantId);

    const updated = await this.stockTransferModel.findOneAndUpdate(
      { _id: id, tenantId },
      { ...dto, updatedBy: userId },
      { new: true },
    ).exec();

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'stock_transfer',
      entityId: id,
      newValue: dto,
      tenantId,
    });

    return updated;
  }

  async deleteTransfer(id: string, userId: string, tenantId: string) {
    const transfer = await this.findOneTransfer(id, tenantId);

    await this.stockTransferModel.findOneAndDelete({ _id: id, tenantId }).exec();

    void this.auditService.log({
      userId,
      action: 'delete',
      entity: 'stock_transfer',
      entityId: id,
      oldValue: transfer.toObject(),
      tenantId,
    });

    return { id };
  }

  async completeTransfer(id: string, userId: string, tenantId: string) {
    const transfer = await this.stockTransferModel.findOneAndUpdate(
      { _id: id, tenantId },
      { status: 'completed', updatedBy: userId },
      { new: true },
    ).exec();

    if (!transfer) throw new NotFoundException(`Stock transfer ${id} not found`);

    void this.auditService.log({
      userId,
      action: 'complete',
      entity: 'stock_transfer',
      entityId: id,
      newValue: { status: 'completed' },
      tenantId,
    });

    return transfer;
  }

  async getTransferStats(tenantId: string) {
    const transfers = await this.stockTransferModel.find({ tenantId }).lean().exec();

    const totalTransfers = transfers.length;
    const draftTransfers = transfers.filter(t => t.status === 'draft').length;
    const pendingTransfers = transfers.filter(t => t.status === 'pending').length;
    const inTransitTransfers = transfers.filter(t => t.status === 'in_transit').length;
    const completedTransfers = transfers.filter(t => t.status === 'completed').length;
    const cancelledTransfers = transfers.filter(t => t.status === 'cancelled').length;
    const totalItems = transfers.reduce((sum, t) => sum + (Array.isArray(t.items) ? t.items.length : 0), 0);
    const highPriorityTransfers = transfers.filter(t => t.priority === 'high' || t.priority === 'urgent').length;

    return {
      totalTransfers,
      draftTransfers,
      pendingTransfers,
      inTransitTransfers,
      completedTransfers,
      cancelledTransfers,
      totalItems,
      highPriorityTransfers,
    };
  }

  // ─── Stock Adjustment Methods ──────────────────────────────────────────────

  async createAdjustment(dto: CreateStockAdjustmentDto, userId: string, tenantId: string) {
    const fieldConfigs = await this.tenantsService.getFieldConfiguration(tenantId, 'stock_adjustment');
    for (const fieldConfig of fieldConfigs) {
      if (fieldConfig.required && !dto.custom_fields?.[fieldConfig.field_id]) {
        throw new BadRequestException(`${fieldConfig.label} is required.`);
      }
    }

    const adjustment_number = dto.adjustment_number || `ADJ-${tenantId.toUpperCase().slice(0, 6)}-${Date.now()}`;

    const newAdjustment = new this.stockAdjustmentModel({
      ...dto,
      adjustment_number,
      status: 'draft',
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });
    const saved = await newAdjustment.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'stock_adjustment',
      entityId: saved.id as string,
      newValue: saved.toObject(),
      tenantId,
    });

    return saved;
  }

  async listAdjustments(query: QueryDto, tenantId: string) {
    const filter = { ...(query.filter || {}), tenantId };
    return this.queryBuilder
      .buildQuery(this.stockAdjustmentModel, { ...query, filter })
      .exec();
  }

  async findOneAdjustment(id: string, tenantId: string) {
    const adjustment = await this.stockAdjustmentModel.findOne({ _id: id, tenantId }).exec();
    if (!adjustment) throw new NotFoundException(`Stock adjustment ${id} not found`);
    return adjustment;
  }

  async updateAdjustment(id: string, dto: UpdateStockAdjustmentDto, userId: string, tenantId: string) {
    await this.findOneAdjustment(id, tenantId);

    const updated = await this.stockAdjustmentModel.findOneAndUpdate(
      { _id: id, tenantId },
      { ...dto, updatedBy: userId },
      { new: true },
    ).exec();

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'stock_adjustment',
      entityId: id,
      newValue: dto,
      tenantId,
    });

    return updated;
  }

  async deleteAdjustment(id: string, userId: string, tenantId: string) {
    const adjustment = await this.findOneAdjustment(id, tenantId);

    await this.stockAdjustmentModel.findOneAndDelete({ _id: id, tenantId }).exec();

    void this.auditService.log({
      userId,
      action: 'delete',
      entity: 'stock_adjustment',
      entityId: id,
      oldValue: adjustment.toObject(),
      tenantId,
    });

    return { id };
  }

  async applyAdjustment(id: string, userId: string, tenantId: string) {
    const adjustment = await this.stockAdjustmentModel.findOneAndUpdate(
      { _id: id, tenantId },
      { status: 'applied', updatedBy: userId },
      { new: true },
    ).exec();

    if (!adjustment) throw new NotFoundException(`Stock adjustment ${id} not found`);

    void this.auditService.log({
      userId,
      action: 'apply',
      entity: 'stock_adjustment',
      entityId: id,
      newValue: { status: 'applied' },
      tenantId,
    });

    return adjustment;
  }
}
