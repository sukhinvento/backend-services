import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CreateFieldConfigurationDto } from './dto/create-field-configuration.dto';
import { Tenant, TenantDocument } from './schemas/tenant.schema';
import { AuditService } from '@audit/audit.service';
import { QueryDto } from '@common/dto/query.dto';
import { QueryBuilderService } from '@common/services/query-builder.service';

@Injectable()
export class TenantsService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    private readonly auditService: AuditService,
    private readonly queryBuilder: QueryBuilderService<TenantDocument>,
  ) {}

  async create(createTenantDto: CreateTenantDto, userId: string) {
    const newTenant = new this.tenantModel({
      ...createTenantDto,
      createdBy: userId,
      updatedBy: userId,
    });
    const savedTenant = await newTenant.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'tenant',
      entityId: savedTenant.id as string,

      newValue: savedTenant.toObject(),
      tenantId: savedTenant.id as string,
    });

    return savedTenant;
  }

  async findAll(query: QueryDto) {
    return this.queryBuilder.buildQuery(this.tenantModel, query).exec();
  }

  async findOne(id: string) {
    return this.tenantModel.findById(id).exec();
  }

  async update(id: string, updateTenantDto: UpdateTenantDto, userId: string) {
    const oldTenant = await this.tenantModel.findById(id).exec();
    const updatedTenant = await this.tenantModel
      .findByIdAndUpdate(
        id,
        { ...updateTenantDto, updatedBy: userId },
        { new: true },
      )
      .exec();

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'tenant',
      entityId: id,

      oldValue: oldTenant?.toObject(),

      newValue: updatedTenant?.toObject(),
      tenantId: id,
    });

    return updatedTenant;
  }

  async remove(id: string, userId: string) {
    const removedTenant = await this.tenantModel.findByIdAndDelete(id).exec();

    void this.auditService.log({
      userId,
      action: 'delete',
      entity: 'tenant',
      entityId: id,

      oldValue: removedTenant?.toObject(),
      tenantId: id,
    });

    return { id };
  }

  async createFieldConfiguration(
    tenantId: string,
    module: string,
    createFieldConfigurationDto: CreateFieldConfigurationDto,
    userId: string,
  ) {
    const tenant = await this.tenantModel.findById(tenantId).exec();
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const oldConfig = tenant.fieldConfigurations.get(module);

    tenant.fieldConfigurations.set(module, createFieldConfigurationDto.fields);
    tenant.updatedBy = userId;
    const savedTenant = await tenant.save();

    void this.auditService.log({
      userId,
      action: 'create_field_configuration',
      entity: 'tenant',
      entityId: tenantId,
      oldValue: oldConfig,
      newValue: createFieldConfigurationDto.fields,
      tenantId,
    });

    return savedTenant;
  }

  async getFieldConfiguration(tenantId: string, module: string) {
    const tenant = await this.tenantModel.findById(tenantId).exec();
    return tenant?.fieldConfigurations.get(module) ?? [];
  }
}
