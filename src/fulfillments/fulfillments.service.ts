import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateFulfillmentDto } from './dto/create-fulfillment.dto';
import { UpdateFulfillmentDto } from './dto/update-fulfillment.dto';
import { Fulfillment, FulfillmentDocument } from './schemas/fulfillment.schema';
import { TenantsService } from '@tenants/tenants.service';
import { AuditService } from '@audit/audit.service';
import { QueryDto } from '@common/dto/query.dto';
import { QueryBuilderService } from '@common/services/query-builder.service';

@Injectable()
export class FulfillmentsService {
  constructor(
    @InjectModel(Fulfillment.name) private fulfillmentModel: Model<FulfillmentDocument>,
    private readonly tenantsService: TenantsService,
    private readonly auditService: AuditService,
    private readonly queryBuilder: QueryBuilderService<FulfillmentDocument>,
  ) {}

  async create(createFulfillmentDto: CreateFulfillmentDto, userId: string) {
    // TODO: Get tenant from request context
    const tenantId = 'pharma_inc';
    const fieldConfigs = await this.tenantsService.getFieldConfiguration(
      tenantId,
      'fulfillment',
    );

    for (const fieldConfig of fieldConfigs) {
      if (
        fieldConfig.required &&
        !createFulfillmentDto.custom_fields?.[fieldConfig.field_id]
      ) {
        throw new BadRequestException(`${fieldConfig.label} is required.`);
      }
    }

    const newFulfillment = new this.fulfillmentModel({
      ...createFulfillmentDto,
      createdBy: userId,
      updatedBy: userId,
    });
    const savedFulfillment = await newFulfillment.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'fulfillment',
      entityId: savedFulfillment.id as string,
      newValue: savedFulfillment.toObject(),
      tenantId,
    });

    return savedFulfillment;
  }

  async findAll(query: QueryDto) {
    return this.queryBuilder.buildQuery(this.fulfillmentModel, query).exec();
  }

  async findOne(id: string) {
    return this.fulfillmentModel.findById(id).exec();
  }

  async update(id: string, updateFulfillmentDto: UpdateFulfillmentDto, userId: string) {
    const oldFulfillment = await this.fulfillmentModel.findById(id).exec();
    const updatedFulfillment = await this.fulfillmentModel
      .findByIdAndUpdate(
        id,
        { ...updateFulfillmentDto, updatedBy: userId },
        { new: true },
      )
      .exec();

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'fulfillment',
      entityId: id,
      oldValue: oldFulfillment?.toObject(),
      newValue: updatedFulfillment?.toObject(),
      tenantId: 'pharma_inc', // TODO: Get from context
    });

    return updatedFulfillment;
  }

  async remove(id: string, userId: string) {
    const removedFulfillment = await this.fulfillmentModel.findByIdAndDelete(id).exec();

    void this.auditService.log({
      userId,
      action: 'delete',
      entity: 'fulfillment',
      entityId: id,
      oldValue: removedFulfillment?.toObject(),
      tenantId: 'pharma_inc', // TODO: Get from context
    });

    return { id };
  }
}
