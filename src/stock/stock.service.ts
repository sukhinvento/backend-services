import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto';
import { UpdateStockTransferDto } from './dto/update-stock-transfer.dto';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { UpdateStockAdjustmentDto } from './dto/update-stock-adjustment.dto';
import { StockTransfer, StockTransferDocument } from './schemas/stock-transfer.schema';
import { StockAdjustment, StockAdjustmentDocument } from './schemas/stock-adjustment.schema';
import { InventoryLocation, InventoryLocationDocument } from '../inventory/schemas/inventory-location.schema';
import { TenantsService } from '@tenants/tenants.service';
import { AuditService } from '@audit/audit.service';
import { QueryDto } from '@common/dto/query.dto';
import { QueryBuilderService } from '@common/services/query-builder.service';
import { NotificationEventService } from '../notifications/notification-event.service';

@Injectable()
export class StockService {
  private readonly logger = new (require('@nestjs/common').Logger)(StockService.name);

  constructor(
    @InjectModel(StockTransfer.name) private stockTransferModel: Model<StockTransferDocument>,
    @InjectModel(StockAdjustment.name) private stockAdjustmentModel: Model<StockAdjustmentDocument>,
    @InjectModel(InventoryLocation.name) private invLocModel: Model<InventoryLocationDocument>,
    private readonly tenantsService: TenantsService,
    private readonly auditService: AuditService,
    private readonly queryBuilder: QueryBuilderService<any>,
    private readonly notifEvent: NotificationEventService,
  ) {}

  // ─── Stock Transfer Methods ────────────────────────────────────────────────

  async createTransfer(dto: CreateStockTransferDto, userId: string, tenantId: string, username?: string) {
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
      createdBy: username || userId,
      updatedBy: username || userId,
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

    this.notifEvent.emit({
      eventType: 'stock_transfer.created',
      entity_id: saved.id as string,
      entity_type: 'stock_transfer',
      tenantId,
      createdBy: userId,
      timestamp: new Date().toISOString(),
      title: 'New Stock Transfer',
      message: `Transfer ${transfer_number} created: ${dto.from_location || 'Source'} → ${dto.to_location || 'Destination'} (${(dto as any).items?.length ?? 0} item(s))`,
      severity: 'info',
      actionUrl: '/stock-transfer',
      metadata: { transfer_number, from: dto.from_location, to: dto.to_location },
    });

    return saved;
  }

  async listTransfers(query: QueryDto, tenantId: string) {
    const filter = { ...(query.filter || {}), tenantId };
    return await this.queryBuilder.buildQuery(this.stockTransferModel, { ...query, filter });
  }

  async findOneTransfer(id: string, tenantId: string) {
    const transfer = await this.stockTransferModel.findOne({ _id: id, tenantId }).exec();
    if (!transfer) throw new NotFoundException(`Stock transfer ${id} not found`);
    return transfer;
  }

  async updateTransfer(id: string, dto: UpdateStockTransferDto, userId: string, tenantId: string, username?: string) {
    const existing = await this.findOneTransfer(id, tenantId);
    const oldStatus = (existing as any)?.status || '';

    const updated = await this.stockTransferModel.findOneAndUpdate(
      { _id: id, tenantId },
      { ...dto, updatedBy: username || userId },
      { new: true },
    ).exec();

    // If status changed to completed, move inventory location stock
    const newStatus = String(dto.status || '').toLowerCase();
    if (newStatus === 'completed' && oldStatus !== 'completed') {
      await this.moveLocationStock(updated, tenantId);
    }

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

  /** Move inventory stock between locations when a transfer completes */
  private async moveLocationStock(transfer: any, tenantId: string) {
    if (!transfer) return;
    const obj = typeof transfer.toObject === 'function' ? transfer.toObject() : transfer;
    const fromLocId = obj.from_location_id;
    const toLocId = obj.to_location_id;
    const toLocName = obj.to_location || '';
    const items: any[] = obj.items || [];

    if (!fromLocId || !toLocId || items.length === 0) return;

    for (const item of items) {
      const itemId = item.item_id || item.id;
      const qty = item.quantity ?? item.qty ?? 0;
      if (!itemId || qty <= 0) continue;

      try {
        // Deduct from source location
        const sourceRec = await this.invLocModel.findOne({
          inventory_item_id: itemId, location_id: fromLocId, tenantId,
        }).exec();
        if (sourceRec) {
          sourceRec.quantity = Math.max(0, sourceRec.quantity - qty);
          await sourceRec.save();
        }

        // Add to destination (upsert)
        const destRec = await this.invLocModel.findOne({
          inventory_item_id: itemId, location_id: toLocId, sub_location: null, tenantId,
        }).exec();
        if (destRec) {
          destRec.quantity += qty;
          await destRec.save();
        } else {
          await new this.invLocModel({
            inventory_item_id: itemId, location_id: toLocId, location_name: toLocName,
            sub_location: null, quantity: qty, tenantId,
          }).save();
        }

        this.logger.log(`Transfer: moved ${qty} of ${itemId} → ${toLocName}`);
      } catch (err) {
        this.logger.error(`Transfer: failed to move item ${itemId}`, err);
      }
    }
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

  async completeTransfer(id: string, userId: string, tenantId: string, username?: string) {
    const transfer = await this.stockTransferModel.findOneAndUpdate(
      { _id: id, tenantId },
      { status: 'completed', updatedBy: username || userId },
      { new: true },
    ).exec();

    if (!transfer) throw new NotFoundException(`Stock transfer ${id} not found`);

    // Move inventory stock between locations
    await this.moveLocationStock(transfer, tenantId);

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

  async createAdjustment(dto: CreateStockAdjustmentDto, userId: string, tenantId: string, username?: string) {
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
      createdBy: username || userId,
      updatedBy: username || userId,
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
    return await this.queryBuilder.buildQuery(this.stockAdjustmentModel, { ...query, filter });
  }

  async findOneAdjustment(id: string, tenantId: string) {
    const adjustment = await this.stockAdjustmentModel.findOne({ _id: id, tenantId }).exec();
    if (!adjustment) throw new NotFoundException(`Stock adjustment ${id} not found`);
    return adjustment;
  }

  async updateAdjustment(id: string, dto: UpdateStockAdjustmentDto, userId: string, tenantId: string, username?: string) {
    await this.findOneAdjustment(id, tenantId);

    const updated = await this.stockAdjustmentModel.findOneAndUpdate(
      { _id: id, tenantId },
      { ...dto, updatedBy: username || userId },
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

  async applyAdjustment(id: string, userId: string, tenantId: string, username?: string) {
    const adjustment = await this.stockAdjustmentModel.findOneAndUpdate(
      { _id: id, tenantId },
      { status: 'applied', updatedBy: username || userId },
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
