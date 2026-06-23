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

  async create(createTenantDto: CreateTenantDto, userId: string, username?: string) {
    const newTenant = new this.tenantModel({
      ...createTenantDto,
      createdBy: username || userId,
      updatedBy: username || userId,
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
    return await this.queryBuilder.buildQuery(this.tenantModel, query);
  }

  async findOne(id: string) {
    return this.findTenantByIdOrSlug(id);
  }

  async update(id: string, updateTenantDto: UpdateTenantDto, userId: string, username?: string) {
    const tenant = await this.findTenantByIdOrSlug(id);
    if (!tenant) return null;
    const oldTenant = tenant.toObject();
    const rawId = tenant._id;
    const isObjectId = /^[0-9a-f]{24}$/i.test(String(rawId));

    let updatedTenant;
    if (isObjectId) {
      updatedTenant = await this.tenantModel
        .findByIdAndUpdate(rawId, { ...updateTenantDto, updatedBy: username || userId }, { new: true })
        .exec();
    } else {
      // String _id — use raw collection update then re-fetch
      await this.tenantModel.collection.updateOne(
        { _id: rawId as any },
        { $set: { ...updateTenantDto, updatedBy: username || userId } },
      );
      updatedTenant = await this.findTenantByIdOrSlug(id);
    }

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'tenant',
      entityId: id,
      oldValue: oldTenant,
      newValue: updatedTenant?.toObject?.() ?? updatedTenant,
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
    username?: string,
  ) {
    const tenant = await this.findTenantByIdOrSlug(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Ensure fieldConfigurations Map is initialized
    if (!tenant.fieldConfigurations) {
      tenant.fieldConfigurations = new Map();
    }

    const oldConfig = tenant.fieldConfigurations.get(module);

    tenant.fieldConfigurations.set(module, createFieldConfigurationDto.fields);
    tenant.updatedBy = username || userId;

    // Use raw update for string _id tenants (avoid CastError on save)
    const rawId = tenant._id;
    const isObjId = /^[0-9a-f]{24}$/i.test(String(rawId));
    let savedTenant;
    if (isObjId) {
      savedTenant = await tenant.save();
    } else {
      // Convert Map to plain object for raw update
      const fcObj: Record<string, any> = {};
      tenant.fieldConfigurations.forEach((val, key) => { fcObj[key] = val; });
      await this.tenantModel.collection.updateOne(
        { _id: rawId as any },
        { $set: { fieldConfigurations: fcObj, updatedBy: username || userId } },
      );
      savedTenant = await this.findTenantByIdOrSlug(String(rawId));
    }

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

  private async findTenantByIdOrSlug(tenantId: string) {
    const isObjectId = /^[0-9a-f]{24}$/i.test(tenantId);

    // If it looks like an ObjectId, use Mongoose findById
    if (isObjectId) {
      const byId = await this.tenantModel.findById(tenantId).exec();
      if (byId) return byId;
    }

    // For string _id values (e.g. "default_tenant") — use raw collection query
    // to bypass Mongoose ObjectId casting
    const rawDoc = await this.tenantModel.collection.findOne({ _id: tenantId as any });
    if (rawDoc) {
      // Hydrate back into a Mongoose document for consistency
      return this.tenantModel.hydrate(rawDoc);
    }

    // Fallback: try by slug
    const bySlug = await this.tenantModel.findOne({ slug: tenantId }).exec();
    if (bySlug) return bySlug;

    // Fallback: try by tenantId field
    return this.tenantModel.findOne({ tenantId }).exec();
  }

  async getFieldConfiguration(tenantId: string, module: string) {
    const tenant = await this.findTenantByIdOrSlug(tenantId);
    return tenant?.fieldConfigurations?.get(module) ?? [];
  }

  /** Return the full tenant document for a given tenantId slug (used by invoice handler) */
  async findByTenantId(tenantId: string) {
    return this.findTenantByIdOrSlug(tenantId);
  }
}
