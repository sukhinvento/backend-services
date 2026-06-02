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

  async create(createInvoiceDto: CreateInvoiceDto, userId: string, tenantId: string, username?: string) {
    const fieldConfigs = await this.tenantsService.getFieldConfiguration(
      tenantId,
      'invoice',
    );

    // Custom fields validation (skip if not present)
    if (createInvoiceDto.custom_fields) {
      for (const fieldConfig of fieldConfigs) {
        if (
          fieldConfig.required &&
          !createInvoiceDto.custom_fields[fieldConfig.field_id]
        ) {
          throw new BadRequestException(`${fieldConfig.label} is required.`);
        }
      }
    }

    // Auto-generate invoice_number if not provided
    const invoice_number = createInvoiceDto.invoice_number || `INV-${Date.now().toString(36).toUpperCase()}`;

    const newInvoice = new this.invoiceModel({
      ...createInvoiceDto,
      invoice_number,
      status: createInvoiceDto.status || 'draft',
      tenantId,
      createdBy: username || userId,
      updatedBy: username || userId,
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

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto, userId: string, username?: string) {
    const oldInvoice = await this.invoiceModel.findById(id).exec();
    const updatedInvoice = await this.invoiceModel
      .findByIdAndUpdate(
        id,
        { ...updateInvoiceDto, updatedBy: username || userId },
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

  async pay(id: string, userId: string, username?: string) {
    const oldInvoice = await this.invoiceModel.findById(id).exec();
    const updatedInvoice = await this.invoiceModel
      .findByIdAndUpdate(
        id,
        { status: 'paid', paid_amount: oldInvoice?.amount || 0, updatedBy: username || userId },
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
      tenantId: oldInvoice?.tenantId || 'pharma_inc',
    });

    return updatedInvoice;
  }

  /**
   * Update the linked invoice when a PO/SO payment is recorded.
   * Finds invoice by order_id and updates paid_amount + status.
   */
  async updatePaymentByOrderId(
    orderId: string,
    paidAmount: number,
    totalAmount: number,
    userId: string,
  ) {
    const invoice = await this.invoiceModel.findOne({ order_id: orderId }).exec();
    if (!invoice) return null;

    let status = 'draft';
    if (paidAmount >= totalAmount && totalAmount > 0) {
      status = 'paid';
    } else if (paidAmount > 0) {
      status = 'partially_paid';
    }

    const oldInvoice = invoice.toObject();
    const updatedInvoice = await this.invoiceModel
      .findByIdAndUpdate(
        invoice._id,
        {
          paid_amount: paidAmount,
          amount: totalAmount,
          status,
          updatedBy: userId,
        },
        { new: true },
      )
      .exec();

    void this.auditService.log({
      userId,
      action: 'payment_update',
      entity: 'invoice',
      entityId: invoice._id as string,
      oldValue: oldInvoice,
      newValue: updatedInvoice?.toObject(),
      tenantId: invoice.tenantId,
    });

    return updatedInvoice;
  }
}
