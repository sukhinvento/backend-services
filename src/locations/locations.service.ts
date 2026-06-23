import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location, LocationDocument } from './schemas/location.schema';
import { TenantsService } from '@tenants/tenants.service';
import { AuditService } from '@audit/audit.service';
import { QueryDto } from '@common/dto/query.dto';
import { QueryBuilderService } from '@common/services/query-builder.service';

@Injectable()
export class LocationsService {
  constructor(
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
    private readonly tenantsService: TenantsService,
    private readonly auditService: AuditService,
    private readonly queryBuilder: QueryBuilderService<LocationDocument>,
  ) {}

  async create(dto: CreateLocationDto, userId: string, tenantId: string, username?: string) {
    try {
      const fieldConfigs = await this.tenantsService.getFieldConfiguration(tenantId, 'location');
      if (fieldConfigs && Array.isArray(fieldConfigs)) {
        for (const fieldConfig of fieldConfigs) {
          if (fieldConfig.required && !dto.custom_fields?.[fieldConfig.field_id]) {
            throw new BadRequestException(`${fieldConfig.label} is required.`);
          }
        }
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
    }

    const existing = await this.locationModel.findOne({ code: dto.code, tenantId }).exec();
    if (existing) {
      throw new BadRequestException(`Location with code ${dto.code} already exists.`);
    }

    const newLocation = new this.locationModel({
      ...dto,
      tenantId,
      createdBy: username || userId,
      updatedBy: username || userId,
    });

    try {
      const saved = await newLocation.save();

      void this.auditService.log({
        userId,
        action: 'create',
        entity: 'location',
        entityId: saved.id as string,
        newValue: saved.toObject(),
        tenantId,
      });

      return saved;
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException(`Location with code ${dto.code} or name ${dto.name} already exists.`);
      }
      throw error;
    }
  }

  async findAll(query: QueryDto, tenantId: string) {
    const queryWithTenant = {
      ...query,
      filter: { ...query.filter, tenantId },
    };
    return await this.queryBuilder.buildQuery(this.locationModel, queryWithTenant);
  }

  async findOne(id: string, tenantId: string) {
    const location = await this.locationModel.findOne({ _id: id, tenantId }).exec();
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
    return location;
  }

  async lookup(tenantId: string, search?: string, limit: number = 25): Promise<any[]> {
    const query: any = { tenantId, is_active: true };
    if (search) {
      query['$or'] = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    const locations = await this.locationModel
      .find(query)
      .select('_id code name type address city state sub_locations')
      .limit(Math.min(limit, 25))
      .sort({ name: 1 })
      .lean()
      .exec();

    return locations.map(l => ({
      value: (l as any)._id.toString(),
      label: l.name,
      code: l.code,
      type: l.type,
      address: [l.address, l.city, l.state].filter(Boolean).join(', '),
      sub_locations: l.sub_locations || [],
    }));
  }

  async update(id: string, dto: UpdateLocationDto, userId: string, tenantId: string, username?: string) {
    const oldLocation = await this.locationModel.findOne({ _id: id, tenantId }).exec();
    if (!oldLocation) {
      throw new NotFoundException('Location not found or access denied');
    }

    const updated = await this.locationModel
      .findByIdAndUpdate(id, { ...dto, updatedBy: username || userId }, { new: true })
      .exec();

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'location',
      entityId: id,
      oldValue: oldLocation?.toObject(),
      newValue: updated?.toObject(),
      tenantId,
    });

    return updated;
  }

  async remove(id: string, userId: string, tenantId: string) {
    const removed = await this.locationModel.findOneAndDelete({ _id: id, tenantId }).exec();
    if (!removed) {
      throw new NotFoundException('Location not found or access denied');
    }

    void this.auditService.log({
      userId,
      action: 'delete',
      entity: 'location',
      entityId: id,
      oldValue: removed?.toObject(),
      tenantId,
    });

    return { id };
  }
}
