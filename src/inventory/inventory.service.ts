import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InventoryItem, InventoryItemDocument } from './schemas/inventory-item.schema';
import { InventoryLocation, InventoryLocationDocument } from './schemas/inventory-location.schema';
import { InventoryBatch, InventoryBatchDocument } from './schemas/inventory-batch.schema';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { AssignLocationDto } from './dto/assign-location.dto';
import { AuditService } from '@audit/audit.service';
import { NotificationEventService } from '../notifications/notification-event.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(InventoryItem.name) private itemModel: Model<InventoryItemDocument>,
    @InjectModel(InventoryLocation.name) private invLocModel: Model<InventoryLocationDocument>,
    @InjectModel(InventoryBatch.name) private batchModel: Model<InventoryBatchDocument>,
    private readonly auditService: AuditService,
    private readonly notifEvent: NotificationEventService,
  ) {}

  async create(dto: CreateInventoryItemDto, userId: string, tenantId: string, username?: string) {
    const saved = await new this.itemModel({ ...dto, tenantId, createdBy: username || userId, updatedBy: username || userId }).save();
    void this.auditService.log({ userId, action: 'create', entity: 'inventory_item', entityId: saved.id as string, newValue: saved.toObject(), tenantId });
    return saved;
  }

  async findAll(tenantId: string, category?: string, low_stock?: boolean, search?: string, page = 1, limit = 25) {
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;
    const filter: Record<string, any> = { tenantId };
    if (category) filter.category = category;
    if (low_stock) {
      filter.$expr = { $lte: ['$current_stock', '$min_stock_level'] };
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.itemModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).exec(),
      this.itemModel.countDocuments(filter).exec(),
    ]);
    return { data, total, page, limit: safeLimit };
  }

  async getLocations(tenantId: string): Promise<string[]> {
    const locations: string[] = await this.itemModel.distinct('location', {
      tenantId,
      location: { $nin: [null, ''] },
    });
    return locations.filter(Boolean).sort();
  }

  async getStats(tenantId: string) {
    const [total, lowStock, outOfStock, valueAgg] = await Promise.all([
      this.itemModel.countDocuments({ tenantId }),
      this.itemModel.countDocuments({
        tenantId,
        $expr: { $and: [{ $gt: ['$current_stock', 0] }, { $lte: ['$current_stock', '$min_stock_level'] }] },
      }),
      this.itemModel.countDocuments({ tenantId, current_stock: 0 }),
      this.itemModel.aggregate([
        { $match: { tenantId } },
        { $group: { _id: null, totalValue: { $sum: { $multiply: ['$current_stock', '$unit_price'] } } } },
      ]),
    ]);
    return {
      total,
      low_stock: lowStock,
      critical_items: lowStock,
      out_of_stock: outOfStock,
      total_value: valueAgg[0]?.totalValue ?? 0,
    };
  }

  async findOne(id: string, tenantId: string) {
    const item = await this.itemModel.findOne({ _id: id, tenantId }).exec();
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  async update(id: string, dto: UpdateInventoryItemDto, userId: string, tenantId: string, username?: string) {
    const old = await this.itemModel.findOne({ _id: id, tenantId }).exec();
    if (!old) throw new NotFoundException('Inventory item not found');
    const updated = await this.itemModel.findByIdAndUpdate(id, { ...dto, updatedBy: username || userId }, { new: true }).exec();
    void this.auditService.log({ userId, action: 'update', entity: 'inventory_item', entityId: id, oldValue: old.toObject(), newValue: updated?.toObject(), tenantId });
    return updated;
  }

  async remove(id: string, userId: string, tenantId: string) {
    const removed = await this.itemModel.findOneAndDelete({ _id: id, tenantId }).exec();
    if (!removed) throw new NotFoundException('Inventory item not found');
    void this.auditService.log({ userId, action: 'delete', entity: 'inventory_item', entityId: id, oldValue: removed.toObject(), tenantId });
    return { id };
  }

  async getDashboardAnalytics(tenantId: string) {
    const [statsAgg, categoryAgg, stockLevels] = await Promise.all([
      this.itemModel.aggregate([
        { $match: { tenantId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalValue: { $sum: { $multiply: ['$current_stock', '$unit_price'] } },
            outOfStock: { $sum: { $cond: [{ $eq: ['$current_stock', 0] }, 1, 0] } },
            critical: {
              $sum: {
                $cond: [
                  { $and: [{ $gt: ['$current_stock', 0] }, { $lte: ['$current_stock', '$min_stock_level'] }] },
                  1, 0,
                ],
              },
            },
            low: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gt: ['$current_stock', '$min_stock_level'] },
                      { $lte: ['$current_stock', { $multiply: ['$min_stock_level', 1.5] }] },
                    ],
                  },
                  1, 0,
                ],
              },
            },
            categories: { $addToSet: '$category' },
          },
        },
      ]),
      this.itemModel.aggregate([
        { $match: { tenantId } },
        {
          $group: {
            _id: '$category',
            items: { $sum: 1 },
            value: { $sum: { $multiply: ['$current_stock', '$unit_price'] } },
            critical: {
              $sum: {
                $cond: [
                  { $and: [{ $gt: ['$current_stock', 0] }, { $lte: ['$current_stock', '$min_stock_level'] }] },
                  1, 0,
                ],
              },
            },
            consumed: {
              $sum: { $max: [{ $subtract: [{ $ifNull: ['$max_stock_level', { $multiply: ['$min_stock_level', 3] }] }, '$current_stock'] }, 0] },
            },
          },
        },
        { $sort: { items: -1 } },
      ]),
      this.itemModel
        .find({ tenantId })
        .sort({ current_stock: 1 })
        .limit(10)
        .select('name current_stock min_stock_level max_stock_level')
        .lean()
        .exec(),
    ]);

    const s = statsAgg[0] ?? { total: 0, totalValue: 0, outOfStock: 0, critical: 0, low: 0, categories: [] };
    const normal = Math.max(0, s.total - s.critical - s.low - s.outOfStock);

    return {
      stats: {
        total: s.total,
        totalValue: s.totalValue,
        outOfStock: s.outOfStock,
        critical: s.critical,
        low: s.low,
        normal,
        categories: (s.categories as string[]).filter(Boolean).length,
      },
      categoryBreakdown: categoryAgg.map((c: any) => ({
        category: c._id || 'Uncategorized',
        items: c.items,
        value: Math.round(c.value),
        critical: c.critical,
        consumed: Math.round(c.consumed),
      })),
      stockLevels: stockLevels.map((item: any) => ({
        name: item.name,
        current: item.current_stock,
        minimum: item.min_stock_level,
        reorder: Math.round((item.min_stock_level ?? 0) * 1.5),
      })),
    };
  }

  async adjustStock(id: string, dto: AdjustStockDto, userId: string, tenantId: string, username?: string) {
    const item = await this.itemModel.findOne({ _id: id, tenantId }).exec();
    if (!item) throw new NotFoundException('Inventory item not found');

    const delta = dto.adjustment_type === 'add' ? dto.quantity : -dto.quantity;
    const newStock = (item.current_stock ?? 0) + delta;
    if (newStock < 0) {
      throw new BadRequestException('Stock cannot go below 0');
    }

    const updated = await this.itemModel
      .findByIdAndUpdate(id, { current_stock: newStock, updatedBy: username || userId }, { new: true })
      .exec();

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'inventory_item',
      entityId: id,
      oldValue: { current_stock: item.current_stock },
      newValue: { current_stock: newStock, reason: dto.reason, adjustment_type: dto.adjustment_type },
      tenantId,
    });

    // Emit notification events based on new stock level
    if (updated) {
      const isOutOfStock = newStock === 0;
      const isLowStock = !isOutOfStock && updated.min_stock_level && newStock <= updated.min_stock_level;
      if (isOutOfStock || isLowStock) {
        this.notifEvent.emit({
          eventType: isOutOfStock ? 'inventory.out_of_stock' : 'inventory.low_stock',
          entity_id: id,
          entity_type: 'inventory_item',
          tenantId,
          createdBy: userId,
          timestamp: new Date().toISOString(),
          title: isOutOfStock ? 'Out of Stock' : 'Low Stock Alert',
          message: `${updated.name} stock is ${isOutOfStock ? 'depleted' : 'below minimum level'} (${newStock} units remaining)`,
          severity: isOutOfStock ? 'error' : 'warning',
          actionUrl: '/inventory',
          metadata: { itemId: id, itemName: updated.name, currentStock: newStock, minStock: updated.min_stock_level },
        });
      }
    }

    return updated;
  }

  async getItemLocations(itemId: string, tenantId: string) {
    await this.findOne(itemId, tenantId);
    return this.invLocModel
      .find({ inventory_item_id: itemId, tenantId })
      .sort({ location_name: 1 })
      .lean()
      .exec();
  }

  // ═══════════════════════════════════════════════════════════════
  //  Batch tracking
  // ═══════════════════════════════════════════════════════════════

  async getItemBatches(itemId: string, tenantId: string, includeExpired = false) {
    await this.findOne(itemId, tenantId);
    const filter: any = { inventory_item_id: itemId, tenantId };
    if (!includeExpired) {
      filter.status = { $in: ['active'] };
    }
    return this.batchModel
      .find(filter)
      .sort({ expiry_date: 1 }) // FEFO — first expiry first out
      .lean()
      .exec();
  }

  async createBatch(
    itemId: string,
    batchData: {
      batch_number: string;
      expiry_date?: string;
      quantity: number;
      po_number?: string;
      po_id?: string;
      manufacturer?: string;
      location_name?: string;
      unit_cost?: number;
    },
    userId: string,
    tenantId: string,
  ) {
    await this.findOne(itemId, tenantId);

    // Check if batch already exists for this item
    const existing = await this.batchModel.findOne({
      inventory_item_id: itemId,
      batch_number: batchData.batch_number,
      tenantId,
    }).exec();

    if (existing) {
      // Add to existing batch quantity
      existing.quantity += batchData.quantity;
      if (batchData.expiry_date) existing.expiry_date = batchData.expiry_date;
      existing.updatedBy = userId;
      const updated = await existing.save();
      return updated;
    }

    // Determine initial status based on expiry
    let status = 'active';
    if (batchData.expiry_date) {
      const expiry = new Date(batchData.expiry_date);
      if (expiry < new Date()) status = 'expired';
    }

    const batch = new this.batchModel({
      inventory_item_id: itemId,
      batch_number: batchData.batch_number,
      expiry_date: batchData.expiry_date || '',
      quantity: batchData.quantity,
      used_quantity: 0,
      received_date: new Date().toISOString().split('T')[0],
      po_number: batchData.po_number || '',
      po_id: batchData.po_id || '',
      manufacturer: batchData.manufacturer || '',
      location_name: batchData.location_name || '',
      unit_cost: batchData.unit_cost || 0,
      status,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });
    const saved = await batch.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'inventory_batch',
      entityId: saved.id as string,
      newValue: saved.toObject(),
      tenantId,
    });

    return saved;
  }

  async getExpiringBatches(tenantId: string, daysAhead = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
    return this.batchModel
      .find({
        tenantId,
        status: 'active',
        expiry_date: { $ne: '', $lte: cutoffDate.toISOString().split('T')[0] },
      })
      .sort({ expiry_date: 1 })
      .lean()
      .exec();
  }

  // ═══════════════════════════════════════════════════════════════
  //  Reorder suggestions — items below min_stock_level
  // ═══════════════════════════════════════════════════════════════

  async getReorderSuggestions(tenantId: string) {
    const items = await this.itemModel
      .find({
        tenantId,
        is_active: true,
        $expr: { $lte: ['$current_stock', '$min_stock_level'] },
      })
      .sort({ current_stock: 1 })
      .lean()
      .exec();

    return items.map((item: any) => {
      const deficit = Math.max(0, (item.min_stock_level || 0) - (item.current_stock || 0));
      // reorder_quantity if set, otherwise order up to max_stock_level, otherwise 2x min
      const suggestedQty = item.reorder_quantity
        || (item.max_stock_level ? item.max_stock_level - item.current_stock : deficit * 2)
        || deficit;

      return {
        _id: item._id,
        sku: item.sku,
        name: item.name,
        category: item.category,
        current_stock: item.current_stock,
        min_stock_level: item.min_stock_level,
        max_stock_level: item.max_stock_level,
        reorder_quantity: item.reorder_quantity,
        deficit,
        suggested_order_qty: Math.max(suggestedQty, 1),
        unit_price: item.unit_price || 0,
        supplier: item.supplier || '',
        supplier_id: item.supplier_id || '',
        estimated_cost: Math.max(suggestedQty, 1) * (item.unit_price || 0),
      };
    });
  }

  async assignItemLocation(itemId: string, dto: AssignLocationDto, userId: string, tenantId: string) {
    await this.findOne(itemId, tenantId);

    const filter = {
      inventory_item_id: itemId,
      location_id: dto.location_id,
      sub_location: dto.sub_location || null,
      tenantId,
    };

    const existing = await this.invLocModel.findOne(filter).exec();

    if (existing) {
      existing.quantity = dto.quantity;
      existing.location_name = dto.location_name;
      if (dto.sub_location !== undefined) existing.sub_location = dto.sub_location;
      const updated = await existing.save();

      void this.auditService.log({
        userId, action: 'update', entity: 'inventory_location', entityId: updated.id as string,
        newValue: updated.toObject(), tenantId,
      });

      return updated;
    }

    const newRecord = new this.invLocModel({
      inventory_item_id: itemId,
      location_id: dto.location_id,
      location_name: dto.location_name,
      sub_location: dto.sub_location || null,
      quantity: dto.quantity,
      tenantId,
    });
    const saved = await newRecord.save();

    void this.auditService.log({
      userId, action: 'create', entity: 'inventory_location', entityId: saved.id as string,
      newValue: saved.toObject(), tenantId,
    });

    return saved;
  }
}
