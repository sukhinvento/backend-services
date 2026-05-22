import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { Vendor, VendorDocument } from './schemas/vendor.schema';
import { TenantsService } from '@tenants/tenants.service';
import { AuditService } from '@audit/audit.service';
import { QueryDto } from '@common/dto/query.dto';
import { VendorQueryService } from './services/vendor-query.service';
import { TaxService } from '../tax/tax.service';

@Injectable()
export class VendorsService {
  constructor(
    @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
    private readonly tenantsService: TenantsService,
    private readonly auditService: AuditService,
    private readonly vendorQueryService: VendorQueryService,
    private readonly taxService: TaxService,
  ) {}

  async create(createVendorDto: CreateVendorDto, userId: string, tenantId: string) {
    
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

    // Validate tax IDs for referential integrity
    if (createVendorDto.applicable_tax_ids && createVendorDto.applicable_tax_ids.length > 0) {
      try {
        const validTaxes = await this.taxService.findByIds(createVendorDto.applicable_tax_ids);
        if (validTaxes.length !== createVendorDto.applicable_tax_ids.length) {
          throw new BadRequestException(
            'One or more tax IDs in applicable_tax_ids are invalid or inactive.',
          );
        }
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('Failed to validate tax IDs.');
      }
    }

    // Validate default_purchase_tax_id
    if (createVendorDto.default_purchase_tax_id) {
      try {
        const defaultTax = await this.taxService.findOne(createVendorDto.default_purchase_tax_id);
        if (!defaultTax || defaultTax.status !== 'active') {
          throw new BadRequestException(
            'Default purchase tax ID is invalid or inactive.',
          );
        }
        // Ensure default tax is in applicable_tax_ids if provided
        if (createVendorDto.applicable_tax_ids && 
            !createVendorDto.applicable_tax_ids.includes(createVendorDto.default_purchase_tax_id)) {
          throw new BadRequestException(
            'Default purchase tax ID must be included in applicable_tax_ids.',
          );
        }
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('Failed to validate default purchase tax ID.');
      }
    }

    // Check for duplicate vendor_code within the same tenant
    const existingVendor = await this.vendorModel.findOne({
      vendor_code: createVendorDto.vendor_code,
      tenantId,
    }).exec();

    if (existingVendor) {
      throw new BadRequestException(
        `Vendor with code ${createVendorDto.vendor_code} already exists.`,
      );
    }

    const newVendor = new this.vendorModel({
      ...createVendorDto,
      tenantId,
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

  async findAll(query: QueryDto, tenantId: string) {
    // Add tenantId filter to the query
    const queryWithTenant = {
      ...query,
      filter: {
        ...query.filter,
        tenantId,
      },
    };
    return this.vendorQueryService.buildQuery(this.vendorModel, queryWithTenant).exec();
  }

  // Additional vendor-specific query methods
  async searchVendors(searchTerm: string, tenantId: string, page: number = 1, limit: number = 10) {
    return this.vendorQueryService.searchVendors(this.vendorModel, searchTerm, tenantId, page, limit);
  }

  async getVendorsByTaxSlab(taxSlab: string, tenantId: string) {
    return this.vendorQueryService.getVendorsByTaxSlab(this.vendorModel, taxSlab, tenantId);
  }

  async getVendorsByLeadTime(maxLeadTime: number, tenantId: string) {
    return this.vendorQueryService.getVendorsByLeadTime(this.vendorModel, maxLeadTime, tenantId);
  }

  async getAvailableFilterFields() {
    return this.vendorQueryService.getAvailableFilterFields(this.vendorModel);
  }

  async findOne(id: string, tenantId: string) {
    return this.vendorModel.findOne({ _id: id, tenantId }).exec();
  }

  async update(id: string, updateVendorDto: UpdateVendorDto, userId: string, tenantId: string) {
    const oldVendor = await this.vendorModel.findOne({ _id: id, tenantId }).exec();
    if (!oldVendor) {
      throw new Error('Vendor not found or access denied');
    }

    // Validate tax IDs for referential integrity if provided
    if (updateVendorDto.applicable_tax_ids && updateVendorDto.applicable_tax_ids.length > 0) {
      try {
        const validTaxes = await this.taxService.findByIds(updateVendorDto.applicable_tax_ids);
        if (validTaxes.length !== updateVendorDto.applicable_tax_ids.length) {
          throw new BadRequestException(
            'One or more tax IDs in applicable_tax_ids are invalid or inactive.',
          );
        }
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('Failed to validate tax IDs.');
      }
    }

    // Validate default_purchase_tax_id if provided
    if (updateVendorDto.default_purchase_tax_id) {
      try {
        const defaultTax = await this.taxService.findOne(updateVendorDto.default_purchase_tax_id);
        if (!defaultTax || defaultTax.status !== 'active') {
          throw new BadRequestException(
            'Default purchase tax ID is invalid or inactive.',
          );
        }
        // Ensure default tax is in applicable_tax_ids if both are provided
        if (updateVendorDto.applicable_tax_ids && 
            !updateVendorDto.applicable_tax_ids.includes(updateVendorDto.default_purchase_tax_id)) {
          throw new BadRequestException(
            'Default purchase tax ID must be included in applicable_tax_ids.',
          );
        }
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('Failed to validate default purchase tax ID.');
      }
    }
    
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
      tenantId,
    });

    return updatedVendor;
  }

  async remove(id: string, userId: string, tenantId: string) {
    const removedVendor = await this.vendorModel.findOneAndDelete({ _id: id, tenantId }).exec();
    if (!removedVendor) {
      throw new Error('Vendor not found or access denied');
    }

    void this.auditService.log({
      userId,
      action: 'delete',
      entity: 'vendor',
      entityId: id,

      oldValue: removedVendor?.toObject(),
      tenantId,
    });

    return { id };
  }
}
