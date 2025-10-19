import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Invoice, InvoiceDocument } from './schemas/invoice.schema';
import { TenantsService } from '@tenants/tenants.service';
import { AuditService } from '@audit/audit.service';
import { QueryDto } from '@common/dto/query.dto';
import { QueryBuilderService } from '@common/services/query-builder.service';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    private readonly tenantsService: TenantsService,
    private readonly auditService: AuditService,
    private readonly queryBuilder: QueryBuilderService<InvoiceDocument>,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto, userId: string) {
    // TODO: Get tenant from request context
    const tenantId = 'pharma_inc';
    const fieldConfigs = await this.tenantsService.getFieldConfiguration(
      tenantId,
      'invoice',
    );

    for (const fieldConfig of fieldConfigs) {
      if (
        fieldConfig.required &&
        !createInvoiceDto.custom_fields[fieldConfig.field_id]
      ) {
        throw new BadRequestException(`${fieldConfig.label} is required.`);
      }
    }

    const newInvoice = new this.invoiceModel({
      ...createInvoiceDto,
      status: 'draft',
      createdBy: userId,
      updatedBy: userId,
    });
    const savedInvoice = await newInvoice.save();

    void this.auditService.log({
      userId,
      action: 'create',
      entity: 'invoice',
      entityId: savedInvoice.id as string,

      newValue: savedInvoice.toObject(),
      tenantId,
    });

    return savedInvoice;
  }

  async findAll(query: QueryDto) {
    return this.queryBuilder.buildQuery(this.invoiceModel, query).exec();
  }

  async findOne(id: string) {
    return this.invoiceModel.findById(id).exec();
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto, userId: string) {
    const oldInvoice = await this.invoiceModel.findById(id).exec();
    const updatedInvoice = await this.invoiceModel
      .findByIdAndUpdate(
        id,
        { ...updateInvoiceDto, updatedBy: userId },
        { new: true },
      )
      .exec();

    void this.auditService.log({
      userId,
      action: 'update',
      entity: 'invoice',
      entityId: id,

      oldValue: oldInvoice?.toObject(),

      newValue: updatedInvoice?.toObject(),
      tenantId: 'pharma_inc', // TODO: Get from context
    });

    return updatedInvoice;
  }

  async remove(id: string, userId: string) {
    const removedInvoice = await this.invoiceModel.findByIdAndDelete(id).exec();

    void this.auditService.log({
      userId,
      action: 'delete',
      entity: 'invoice',
      entityId: id,

      oldValue: removedInvoice?.toObject(),
      tenantId: 'pharma_inc', // TODO: Get from context
    });

    return { id };
  }

  async pay(id: string, userId: string) {
    const oldInvoice = await this.invoiceModel.findById(id).exec();
    const updatedInvoice = await this.invoiceModel
      .findByIdAndUpdate(
        id,
        { status: 'paid', updatedBy: userId },
        { new: true },
      )
      .exec();

    void this.auditService.log({
      userId,
      action: 'pay',
      entity: 'invoice',
      entityId: id,

      oldValue: oldInvoice?.toObject(),

      newValue: updatedInvoice?.toObject(),
      tenantId: 'pharma_inc', // TODO: Get from context
    });

    return updatedInvoice;
  }
}
