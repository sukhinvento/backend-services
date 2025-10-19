import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { SalesOrder, SalesOrderDocument } from './schemas/sales-order.schema';
import { TenantsService } from '@tenants/tenants.service';
import { AuditService } from '@audit/audit.service';
import { QueryDto } from '@common/dto/query.dto';
import { QueryBuilderService } from '@common/services/query-builder.service';

@Injectable()
export class SalesOrdersService {
  constructor(
    @InjectModel(SalesOrder.name)
    private salesOrderModel: Model<SalesOrderDocument>,
    private readonly tenantsService: TenantsService,
    private readonly auditService: AuditService,
    private readonly queryBuilder: QueryBuilderService<SalesOrderDocument>,
  ) {}

  async create(createSalesOrderDto: CreateSalesOrderDto, userId: string) {
    // TODO: Get tenant from request context
    const tenantId = 'freshmart';
    const fieldConfigs = await this.tenantsService.getFieldConfiguration(
      tenantId,
      'sales_order',
    );

    for (const fieldConfig of fieldConfigs) {
      if (
        fieldConfig.required &&
        !createSalesOrderDto.custom_fields[fieldConfig.field_id]
      ) {
        throw new BadRequestException(`${fieldConfig.label} is required.`);
      }
    }

    const newSalesOrder = new this.salesOrderModel({
      ...createSalesOrderDto,
      status: 'draft',
      createdBy: userId,
      updatedBy: userId,
    });
    const savedSalesOrder = await newSalesOrder.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'sales_order',
      entityId: savedSalesOrder.id as string,

      newValue: savedSalesOrder.toObject(),
      tenantId,
    });

    return savedSalesOrder;
  }

  async findAll(query: QueryDto) {
    return this.queryBuilder.buildQuery(this.salesOrderModel, query).exec();
  }

  async findOne(id: string) {
    return this.salesOrderModel.findById(id).exec();
  }

  async update(
    id: string,
    updateSalesOrderDto: UpdateSalesOrderDto,
    userId: string,
  ) {
    const oldSalesOrder = await this.salesOrderModel.findById(id).exec();
    const updatedSalesOrder = await this.salesOrderModel
      .findByIdAndUpdate(
        id,
        { ...updateSalesOrderDto, updatedBy: userId },
        { new: true },
      )
      .exec();

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'sales_order',
      entityId: id,

      oldValue: oldSalesOrder?.toObject(),

      newValue: updatedSalesOrder?.toObject(),
      tenantId: 'freshmart', // TODO: Get from context
    });

    return updatedSalesOrder;
  }

  async remove(id: string, userId: string) {
    const removedSalesOrder = await this.salesOrderModel
      .findByIdAndDelete(id)
      .exec();

    void this.auditService.log({
      userId,
      action: 'delete',
      entity: 'sales_order',
      entityId: id,

      oldValue: removedSalesOrder?.toObject(),
      tenantId: 'freshmart', // TODO: Get from context
    });

    return { id };
  }

  async ship(id: string, userId: string) {
    const oldSalesOrder = await this.salesOrderModel.findById(id).exec();
    const updatedSalesOrder = await this.salesOrderModel
      .findByIdAndUpdate(
        id,
        { status: 'shipped', updatedBy: userId },
        { new: true },
      )
      .exec();

    void this.auditService.log({
      userId,
      action: 'ship',
      entity: 'sales_order',
      entityId: id,

      oldValue: oldSalesOrder?.toObject(),

      newValue: updatedSalesOrder?.toObject(),
      tenantId: 'freshmart', // TODO: Get from context
    });

    return updatedSalesOrder;
  }

  async invoice(id: string, userId: string) {
    const oldSalesOrder = await this.salesOrderModel.findById(id).exec();
    const updatedSalesOrder = await this.salesOrderModel
      .findByIdAndUpdate(
        id,
        { status: 'invoiced', updatedBy: userId },
        { new: true },
      )
      .exec();

    void this.auditService.log({
      userId,
      action: 'invoice',
      entity: 'sales_order',
      entityId: id,

      oldValue: oldSalesOrder?.toObject(),

      newValue: updatedSalesOrder?.toObject(),
      tenantId: 'freshmart', // TODO: Get from context
    });

    return updatedSalesOrder;
  }
}
