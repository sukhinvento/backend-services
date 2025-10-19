import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { Vendor, VendorDocument } from './schemas/vendor.schema';
import { TenantsService } from '@tenants/tenants.service';
import { AuditService } from '@audit/audit.service';
import { QueryDto } from '@common/dto/query.dto';
import { QueryBuilderService } from '@common/services/query-builder.service';

@Injectable()
export class VendorsService {
  constructor(
    @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
    private readonly tenantsService: TenantsService,
    private readonly auditService: AuditService,
    private readonly queryBuilder: QueryBuilderService<VendorDocument>,
  ) {}

  async create(createVendorDto: CreateVendorDto, userId: string) {
    // TODO: Get tenant from request context
    const tenantId = 'pharma_inc';
    
    try {
      const fieldConfigs = await this.tenantsService.getFieldConfiguration(
        tenantId,
        'vendor',
      );

      // Only validate if field configurations exist
      if (fieldConfigs && Array.isArray(fieldConfigs)) {
        for (const fieldConfig of fieldConfigs) {
          if (
            fieldConfig.required &&
            !createVendorDto.custom_fields?.[fieldConfig.field_id]
          ) {
            throw new BadRequestException(`${fieldConfig.label} is required.`);
          }
        }
      }
    } catch (error) {
      // If tenant config doesn't exist, continue without custom field validation
      console.warn('Tenant configuration not found, skipping custom field validation');
    }

    // Check for duplicate vendor_code
    const existingVendor = await this.vendorModel.findOne({
      vendor_code: createVendorDto.vendor_code,
    }).exec();

    if (existingVendor) {
      throw new BadRequestException(
        `Vendor with code ${createVendorDto.vendor_code} already exists.`,
      );
    }

    const newVendor = new this.vendorModel({
      ...createVendorDto,
      createdBy: userId,
      updatedBy: userId,
    });
    
    try {
      const savedVendor = await newVendor.save();

      void this.auditService.log({
        userId,
        action: 'create',
        entity: 'vendor',
        entityId: savedVendor.id as string,
        newValue: savedVendor.toObject(),
        tenantId,
      });

      return savedVendor;
    } catch (error) {
      if (error.code === 11000) {
        // MongoDB duplicate key error
        throw new BadRequestException(
          `Vendor with code ${createVendorDto.vendor_code} already exists.`,
        );
      }
      throw error;
    }
  }

  async findAll(query: QueryDto) {
    return this.queryBuilder.buildQuery(this.vendorModel, query).exec();
  }

  async findOne(id: string) {
    return this.vendorModel.findById(id).exec();
  }

  async update(id: string, updateVendorDto: UpdateVendorDto, userId: string) {
    const oldVendor = await this.vendorModel.findById(id).exec();
    const updatedVendor = await this.vendorModel
      .findByIdAndUpdate(
        id,
        { ...updateVendorDto, updatedBy: userId },
        { new: true },
      )
      .exec();

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'vendor',
      entityId: id,

      oldValue: oldVendor?.toObject(),

      newValue: updatedVendor?.toObject(),
      tenantId: 'pharma_inc', // TODO: Get from context
    });

    return updatedVendor;
  }

  async remove(id: string, userId: string) {
    const removedVendor = await this.vendorModel.findByIdAndDelete(id).exec();

    void this.auditService.log({
      userId,
      action: 'delete',
      entity: 'vendor',
      entityId: id,

      oldValue: removedVendor?.toObject(),
      tenantId: 'pharma_inc', // TODO: Get from context
    });

    return { id };
  }
}
