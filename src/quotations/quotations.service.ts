import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { Quotation, QuotationDocument } from './schemas/quotation.schema';
import { TenantsService } from '@tenants/tenants.service';
import { AuditService } from '@audit/audit.service';
import { QueryDto } from '@common/dto/query.dto';
import { QueryBuilderService } from '@common/services/query-builder.service';

@Injectable()
export class QuotationsService {
  constructor(
    @InjectModel(Quotation.name) private quotationModel: Model<QuotationDocument>,
    private readonly tenantsService: TenantsService,
    private readonly auditService: AuditService,
    private readonly queryBuilder: QueryBuilderService<QuotationDocument>,
  ) {}

  async create(createQuotationDto: CreateQuotationDto, userId: string) {
    // TODO: Get tenant from request context
    const tenantId = 'pharma_inc';
    const fieldConfigs = await this.tenantsService.getFieldConfiguration(
      tenantId,
      'quotation',
    );

    for (const fieldConfig of fieldConfigs) {
      if (
        fieldConfig.required &&
        !createQuotationDto.custom_fields?.[fieldConfig.field_id]
      ) {
        throw new BadRequestException(`${fieldConfig.label} is required.`);
      }
    }

    const newQuotation = new this.quotationModel({
      ...createQuotationDto,
      createdBy: userId,
      updatedBy: userId,
    });
    const savedQuotation = await newQuotation.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'quotation',
      entityId: savedQuotation.id as string,
      newValue: savedQuotation.toObject(),
      tenantId,
    });

    return savedQuotation;
  }

  async findAll(query: QueryDto) {
    return this.queryBuilder.buildQuery(this.quotationModel, query).exec();
  }

  async findOne(id: string) {
    return this.quotationModel.findById(id).exec();
  }

  async update(id: string, updateQuotationDto: UpdateQuotationDto, userId: string) {
    const oldQuotation = await this.quotationModel.findById(id).exec();
    const updatedQuotation = await this.quotationModel
      .findByIdAndUpdate(
        id,
        { ...updateQuotationDto, updatedBy: userId },
        { new: true },
      )
      .exec();

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'quotation',
      entityId: id,
      oldValue: oldQuotation?.toObject(),
      newValue: updatedQuotation?.toObject(),
      tenantId: 'pharma_inc', // TODO: Get from context
    });

    return updatedQuotation;
  }

  async remove(id: string, userId: string) {
    const removedQuotation = await this.quotationModel.findByIdAndDelete(id).exec();

    void this.auditService.log({
      userId,
      action: 'delete',
      entity: 'quotation',
      entityId: id,
      oldValue: removedQuotation?.toObject(),
      tenantId: 'pharma_inc', // TODO: Get from context
    });

    return { id };
  }

  async approve(id: string, userId: string) {
    const quotation = await this.quotationModel.findByIdAndUpdate(
      id,
      { status: 'approved', updatedBy: userId },
      { new: true },
    ).exec();

    void this.auditService.log({
      userId,
      action: 'approve',
      entity: 'quotation',
      entityId: id,
      oldValue: { status: 'draft' },
      newValue: { status: 'approved' },
      tenantId: 'pharma_inc',
    });

    return quotation;
  }

  async reject(id: string, userId: string) {
    const quotation = await this.quotationModel.findByIdAndUpdate(
      id,
      { status: 'rejected', updatedBy: userId },
      { new: true },
    ).exec();

    void this.auditService.log({
      userId,
      action: 'reject',
      entity: 'quotation',
      entityId: id,
      oldValue: { status: 'draft' },
      newValue: { status: 'rejected' },
      tenantId: 'pharma_inc',
    });

    return quotation;
  }

  async amend(id: string, updateQuotationDto: UpdateQuotationDto, userId: string) {
    const oldQuotation = await this.quotationModel.findById(id).exec();
    const updatedQuotation = await this.quotationModel
      .findByIdAndUpdate(
        id,
        { 
          ...updateQuotationDto, 
          status: 'draft',
          updatedBy: userId 
        },
        { new: true },
      )
      .exec();

    void this.auditService.log({
      userId,
      action: 'amend',
      entity: 'quotation',
      entityId: id,
      oldValue: oldQuotation?.toObject(),
      newValue: updatedQuotation?.toObject(),
      tenantId: 'pharma_inc',
    });

    return updatedQuotation;
  }
}
