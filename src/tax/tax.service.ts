import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { Tax, TaxDocument } from './schemas/tax.schema';
import { TenantsService } from '@tenants/tenants.service';
import { AuditService } from '@audit/audit.service';
import { QueryDto } from '@common/dto/query.dto';
import { QueryBuilderService } from '@common/services/query-builder.service';

@Injectable()
export class TaxService {
  constructor(
    @InjectModel(Tax.name) private taxModel: Model<TaxDocument>,
    private readonly tenantsService: TenantsService,
    private readonly auditService: AuditService,
    private readonly queryBuilder: QueryBuilderService<any>,
  ) {}

  async create(createTaxDto: CreateTaxDto, userId: string) {
    const tenantId = 'pharma_inc'; // TODO: Get tenant from request context
    
    // Validate field configurations
    const fieldConfigs = await this.tenantsService.getFieldConfiguration(
      tenantId,
      'tax',
    );

    for (const fieldConfig of fieldConfigs) {
      if (
        fieldConfig.required &&
        !createTaxDto.custom_fields?.[fieldConfig.field_id]
      ) {
        throw new BadRequestException(`${fieldConfig.label} is required.`);
      }
    }

    // Check for duplicate tax code
    const existingTax = await this.taxModel.findOne({ 
      tax_code: createTaxDto.tax_code 
    }).exec();
    
    if (existingTax) {
      throw new BadRequestException(`Tax code ${createTaxDto.tax_code} already exists.`);
    }

    // Validate rate
    if (createTaxDto.rate_type === 'percentage' && createTaxDto.rate > 100) {
      throw new BadRequestException('Percentage rate cannot exceed 100%.');
    }

    // Validate effective dates
    if (createTaxDto.effective_from && createTaxDto.effective_to) {
      if (new Date(createTaxDto.effective_from) > new Date(createTaxDto.effective_to)) {
        throw new BadRequestException('Effective from date must be before effective to date.');
      }
    }

    const newTax = new this.taxModel({
      ...createTaxDto,
      createdBy: userId,
      updatedBy: userId,
    });
    const savedTax = await newTax.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'tax',
      entityId: savedTax.id as string,
      newValue: savedTax.toObject(),
      tenantId,
    });

    return savedTax;
  }

  async findAll(query: QueryDto) {
    return this.queryBuilder.buildQuery(this.taxModel, query).exec();
  }

  async findOne(id: string) {
    const tax = await this.taxModel.findById(id).exec();
    if (!tax) {
      throw new NotFoundException(`Tax with ID ${id} not found.`);
    }
    return tax;
  }

  async findByCode(taxCode: string) {
    const tax = await this.taxModel.findOne({ tax_code: taxCode }).exec();
    if (!tax) {
      throw new NotFoundException(`Tax with code ${taxCode} not found.`);
    }
    return tax;
  }

  async findByIds(taxIds: string[]) {
    return this.taxModel.find({ 
      _id: { $in: taxIds },
      status: 'active'
    }).exec();
  }

  async findActiveTaxes(applicableOn?: 'sales' | 'purchase' | 'both') {
    const now = new Date();
    const query: any = {
      status: 'active',
      $or: [
        { 
          effective_from: { $lte: now }, 
          effective_to: { $gte: now } 
        },
        { effective_from: { $exists: false } },
        { effective_to: { $exists: false } },
      ],
    };

    // Filter by applicable_on
    if (applicableOn) {
      query.applicable_on = { $in: [applicableOn, 'both'] };
    }

    return this.taxModel.find(query).sort({ priority: 1 }).exec();
  }

  async update(id: string, updateTaxDto: UpdateTaxDto, userId: string) {
    const oldTax = await this.taxModel.findById(id).exec();
    
    if (!oldTax) {
      throw new NotFoundException(`Tax with ID ${id} not found.`);
    }

    // Check for duplicate tax code if being updated
    if (updateTaxDto.tax_code && updateTaxDto.tax_code !== oldTax.tax_code) {
      const existingTax = await this.taxModel.findOne({ 
        tax_code: updateTaxDto.tax_code,
        _id: { $ne: id }
      }).exec();
      
      if (existingTax) {
        throw new BadRequestException(`Tax code ${updateTaxDto.tax_code} already exists.`);
      }
    }

    // Validate rate if being updated
    if (updateTaxDto.rate_type === 'percentage' && updateTaxDto.rate && updateTaxDto.rate > 100) {
      throw new BadRequestException('Percentage rate cannot exceed 100%.');
    }

    // Validate effective dates if being updated
    const effectiveFrom = updateTaxDto.effective_from || oldTax.effective_from;
    const effectiveTo = updateTaxDto.effective_to || oldTax.effective_to;
    
    if (effectiveFrom && effectiveTo) {
      if (new Date(effectiveFrom) > new Date(effectiveTo)) {
        throw new BadRequestException('Effective from date must be before effective to date.');
      }
    }

    const updatedTax = await this.taxModel
      .findByIdAndUpdate(
        id,
        { ...updateTaxDto, updatedBy: userId },
        { new: true },
      )
      .exec();

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'tax',
      entityId: id,
      oldValue: oldTax?.toObject(),
      newValue: updatedTax?.toObject(),
      tenantId: 'pharma_inc', // TODO: Get from context
    });

    return updatedTax;
  }

  async remove(id: string, userId: string) {
    const removedTax = await this.taxModel.findByIdAndDelete(id).exec();

    if (!removedTax) {
      throw new NotFoundException(`Tax with ID ${id} not found.`);
    }

    void this.auditService.log({
      userId,
      action: 'delete',
      entity: 'tax',
      entityId: id,
      oldValue: removedTax?.toObject(),
      tenantId: 'pharma_inc', // TODO: Get from context
    });

    return { id };
  }

  async archive(id: string, userId: string) {
    const tax = await this.taxModel.findById(id).exec();
    
    if (!tax) {
      throw new NotFoundException(`Tax with ID ${id} not found.`);
    }

    const archivedTax = await this.taxModel
      .findByIdAndUpdate(
        id,
        { status: 'archived', updatedBy: userId },
        { new: true },
      )
      .exec();

    void this.auditService.log({
      userId,
      action: 'archive',
      entity: 'tax',
      entityId: id,
      oldValue: { status: tax.status },
      newValue: { status: 'archived' },
      tenantId: 'pharma_inc',
    });

    return archivedTax;
  }

  async activate(id: string, userId: string) {
    const tax = await this.taxModel.findById(id).exec();
    
    if (!tax) {
      throw new NotFoundException(`Tax with ID ${id} not found.`);
    }

    const activatedTax = await this.taxModel
      .findByIdAndUpdate(
        id,
        { status: 'active', updatedBy: userId },
        { new: true },
      )
      .exec();

    void this.auditService.log({
      userId,
      action: 'activate',
      entity: 'tax',
      entityId: id,
      oldValue: { status: tax.status },
      newValue: { status: 'active' },
      tenantId: 'pharma_inc',
    });

    return activatedTax;
  }

  async calculateTax(amount: number, taxIds: string[]): Promise<{
    subtotal: number;
    taxes: Array<{ taxId: string; taxName: string; rate: number; amount: number }>;
    total: number;
  }> {
    const taxes = await this.taxModel.find({ 
      _id: { $in: taxIds },
      status: 'active'
    }).sort({ priority: 1 }).exec();

    let taxableAmount = amount;
    const taxBreakdown: Array<{ taxId: string; taxName: string; rate: number; amount: number }> = [];
    let totalTaxAmount = 0;

    for (const tax of taxes) {
      let taxAmount = 0;

      if (tax.rate_type === 'percentage') {
        taxAmount = (taxableAmount * tax.rate) / 100;
      } else {
        taxAmount = tax.rate;
      }

      // Apply configuration constraints
      if (tax.configuration?.exempt_threshold && amount < tax.configuration.exempt_threshold) {
        continue;
      }

      if (tax.configuration?.min_amount && taxAmount < tax.configuration.min_amount) {
        continue;
      }

      if (tax.configuration?.max_amount && taxAmount > tax.configuration.max_amount) {
        taxAmount = tax.configuration.max_amount;
      }

      taxBreakdown.push({
        taxId: tax.id as string,
        taxName: tax.name,
        rate: tax.rate,
        amount: taxAmount,
      });

      totalTaxAmount += taxAmount;

      // If compound tax, add this tax to the taxable amount for next tax
      if (tax.is_compound) {
        taxableAmount += taxAmount;
      }
    }

    return {
      subtotal: amount,
      taxes: taxBreakdown,
      total: amount + totalTaxAmount,
    };
  }
}

