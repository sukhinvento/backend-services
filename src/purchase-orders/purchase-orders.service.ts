import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import {
  PurchaseOrder,
  PurchaseOrderDocument,
} from './schemas/purchase-order.schema';
import { TenantsService } from '@tenants/tenants.service';
import { AuditService } from '@audit/audit.service';
import { QueryDto } from '@common/dto/query.dto';
import { QueryBuilderService } from '@common/services/query-builder.service';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectModel(PurchaseOrder.name)
    private purchaseOrderModel: Model<PurchaseOrderDocument>,
    private readonly tenantsService: TenantsService,
    private readonly auditService: AuditService,
    private readonly queryBuilder: QueryBuilderService<PurchaseOrderDocument>,
  ) {}

  async create(createPurchaseOrderDto: CreatePurchaseOrderDto, userId: string) {
    // TODO: Get tenant from request context
    const tenantId = 'furniture_world';
    const fieldConfigs = await this.tenantsService.getFieldConfiguration(
      tenantId,
      'purchase_order',
    );

    for (const fieldConfig of fieldConfigs) {
      if (
        fieldConfig.required &&
        !createPurchaseOrderDto.custom_fields[fieldConfig.field_id]
      ) {
        throw new BadRequestException(`${fieldConfig.label} is required.`);
      }
    }

    const newPurchaseOrder = new this.purchaseOrderModel({
      ...createPurchaseOrderDto,
      status: 'draft',
      createdBy: userId,
      updatedBy: userId,
    });
    const savedPurchaseOrder = await newPurchaseOrder.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'purchase_order',
      entityId: savedPurchaseOrder.id as string,

      newValue: savedPurchaseOrder.toObject(),
      tenantId,
    });

    return savedPurchaseOrder;
  }

  async findAll(query: QueryDto) {
    return this.queryBuilder.buildQuery(this.purchaseOrderModel, query).exec();
  }

  async findOne(id: string) {
    return this.purchaseOrderModel.findById(id).exec();
  }

  async update(
    id: string,
    updatePurchaseOrderDto: UpdatePurchaseOrderDto,
    userId: string,
  ) {
    const oldPurchaseOrder = await this.purchaseOrderModel.findById(id).exec();
    const updatedPurchaseOrder = await this.purchaseOrderModel
      .findByIdAndUpdate(
        id,
        { ...updatePurchaseOrderDto, updatedBy: userId },
        { new: true },
      )
      .exec();

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'purchase_order',
      entityId: id,

      oldValue: oldPurchaseOrder?.toObject(),

      newValue: updatedPurchaseOrder?.toObject(),
      tenantId: 'furniture_world', // TODO: Get from context
    });

    return updatedPurchaseOrder;
  }

  async remove(id: string, userId: string) {
    const removedPurchaseOrder = await this.purchaseOrderModel
      .findByIdAndDelete(id)
      .exec();

    void this.auditService.log({
      userId,
      action: 'delete',
      entity: 'purchase_order',
      entityId: id,

      oldValue: removedPurchaseOrder?.toObject(),
      tenantId: 'furniture_world', // TODO: Get from context
    });

    return { id };
  }

  async approve(id: string, userId: string) {
    const oldPurchaseOrder = await this.purchaseOrderModel.findById(id).exec();
    const updatedPurchaseOrder = await this.purchaseOrderModel
      .findByIdAndUpdate(
        id,
        { status: 'approved', updatedBy: userId },
        { new: true },
      )
      .exec();

    void this.auditService.log({
      userId,
      action: 'approve',
      entity: 'purchase_order',
      entityId: id,

      oldValue: oldPurchaseOrder?.toObject(),

      newValue: updatedPurchaseOrder?.toObject(),
      tenantId: 'furniture_world', // TODO: Get from context
    });

    return updatedPurchaseOrder;
  }
}
