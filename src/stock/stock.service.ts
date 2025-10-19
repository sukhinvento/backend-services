import { Injectable, BadRequestException } from '@nestjs/common';
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

  // Stock Transfer Methods
  async createTransfer(createStockTransferDto: CreateStockTransferDto, userId: string) {
    const tenantId = 'pharma_inc';
    const fieldConfigs = await this.tenantsService.getFieldConfiguration(
      tenantId,
      'stock_transfer',
    );

    for (const fieldConfig of fieldConfigs) {
      if (
        fieldConfig.required &&
        !createStockTransferDto.custom_fields?.[fieldConfig.field_id]
      ) {
        throw new BadRequestException(`${fieldConfig.label} is required.`);
      }
    }

    const newTransfer = new this.stockTransferModel({
      ...createStockTransferDto,
      createdBy: userId,
      updatedBy: userId,
    });
    const savedTransfer = await newTransfer.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'stock_transfer',
      entityId: savedTransfer.id as string,
      newValue: savedTransfer.toObject(),
      tenantId,
    });

    return savedTransfer;
  }

  async listTransfers(query: QueryDto) {
    return this.queryBuilder.buildQuery(this.stockTransferModel, query).exec();
  }

  async completeTransfer(id: string, userId: string) {
    const transfer = await this.stockTransferModel.findByIdAndUpdate(
      id,
      { status: 'completed', updatedBy: userId },
      { new: true },
    ).exec();

    void this.auditService.log({
      userId,
      action: 'complete',
      entity: 'stock_transfer',
      entityId: id,
      oldValue: { status: 'pending' },
      newValue: { status: 'completed' },
      tenantId: 'pharma_inc',
    });

    return transfer;
  }

  // Stock Adjustment Methods
  async createAdjustment(createStockAdjustmentDto: CreateStockAdjustmentDto, userId: string) {
    const tenantId = 'pharma_inc';
    const fieldConfigs = await this.tenantsService.getFieldConfiguration(
      tenantId,
      'stock_adjustment',
    );

    for (const fieldConfig of fieldConfigs) {
      if (
        fieldConfig.required &&
        !createStockAdjustmentDto.custom_fields?.[fieldConfig.field_id]
      ) {
        throw new BadRequestException(`${fieldConfig.label} is required.`);
      }
    }

    const newAdjustment = new this.stockAdjustmentModel({
      ...createStockAdjustmentDto,
      createdBy: userId,
      updatedBy: userId,
    });
    const savedAdjustment = await newAdjustment.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'stock_adjustment',
      entityId: savedAdjustment.id as string,
      newValue: savedAdjustment.toObject(),
      tenantId,
    });

    return savedAdjustment;
  }

  async listAdjustments(query: QueryDto) {
    return this.queryBuilder.buildQuery(this.stockAdjustmentModel, query).exec();
  }

  async applyAdjustment(id: string, userId: string) {
    const adjustment = await this.stockAdjustmentModel.findByIdAndUpdate(
      id,
      { status: 'applied', updatedBy: userId },
      { new: true },
    ).exec();

    void this.auditService.log({
      userId,
      action: 'apply',
      entity: 'stock_adjustment',
      entityId: id,
      oldValue: { status: 'pending' },
      newValue: { status: 'applied' },
      tenantId: 'pharma_inc',
    });

    return adjustment;
  }
}
