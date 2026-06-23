import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type PurchaseOrderDocument = PurchaseOrder & Document;

@Schema({ timestamps: true })
export class PurchaseOrder extends BaseSchema {
  @Prop({ required: true })
  po_number: string;

  @Prop()
  vendor_id: string;

  @Prop()
  vendor_name: string;

  @Prop()
  vendor_phone: string;

  @Prop()
  vendor_email: string;

  @Prop()
  vendor_address: string;

  /** Vendor's GSTIN — required on GST purchase invoice (buyer GSTIN) */
  @Prop()
  vendor_gstin: string;

  /** Vendor's state code — used to determine IGST vs CGST+SGST */
  @Prop()
  vendor_state_code: string;

  @Prop()
  shipping_address: string;

  @Prop()
  order_date: string;

  @Prop()
  delivery_date: string;

  @Prop()
  fulfilment_date: string;

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  items: Record<string, any>[];

  @Prop({ default: 0 })
  grand_total: number;

  @Prop({ default: 0 })
  paid_amount: number;

  @Prop()
  payment_method: string;

  @Prop()
  notes: string;

  @Prop()
  approved_by: string;

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  remarks: Record<string, any>[];

  @Prop({ default: 'draft' })
  status: string;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  custom_fields: Record<string, any>;
}

export const PurchaseOrderSchema = SchemaFactory.createForClass(PurchaseOrder);
PurchaseOrderSchema.index({ tenantId: 1, po_number: 1 }, { unique: true });
PurchaseOrderSchema.index({ tenantId: 1, status: 1 });
