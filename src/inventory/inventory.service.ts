import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InventoryItem, InventoryItemDocument } from './schemas/inventory-item.schema';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { AuditService } from '@audit/audit.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(InventoryItem.name) private itemModel: Model<InventoryItemDocument>,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateInventoryItemDto, userId: string, tenantId: string) {
    const saved = await new this.itemModel({ ...dto, tenantId, createdBy: userId, updatedBy: userId }).save();
    void this.auditService.log({ userId, action: 'create', entity: 'inventory_item', entityId: saved.id as string, newValue: saved.toObject(), tenantId });
    return saved;
  }

  async findAll(tenantId: string, category?: string, low_stock?: boolean, search?: string) {
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
    return this.itemModel.find(filter).sort({ name: 1 }).exec();
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

  async update(id: string, dto: UpdateInventoryItemDto, userId: string, tenantId: string) {
    const old = await this.itemModel.findOne({ _id: id, tenantId }).exec();
    if (!old) throw new NotFoundException('Inventory item not found');
    const updated = await this.itemModel.findByIdAndUpdate(id, { ...dto, updatedBy: userId }, { new: true }).exec();
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

  async adjustStock(id: string, dto: AdjustStockDto, userId: string, tenantId: string) {
    const item = await this.itemModel.findOne({ _id: id, tenantId }).exec();
    if (!item) throw new NotFoundException('Inventory item not found');

    const delta = dto.adjustment_type === 'add' ? dto.quantity : -dto.quantity;
    const newStock = (item.current_stock ?? 0) + delta;
    if (newStock < 0) {
      throw new BadRequestException('Stock cannot go below 0');
    }

    const updated = await this.itemModel
      .findByIdAndUpdate(id, { current_stock: newStock, updatedBy: userId }, { new: true })
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

    return updated;
  }
}
