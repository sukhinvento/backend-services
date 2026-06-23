import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type InvoiceDocument = Invoice & Document;

@Schema({ timestamps: true })
export class Invoice extends BaseSchema {
  @Prop({ required: true, unique: true })
  invoice_number: string;

  @Prop()
  order_id: string;

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  items: Record<string, any>[];

  @Prop({ default: 0 })
  subtotal: number;

  @Prop({ default: 0 })
  total_tax: number;

  @Prop({ default: 0 })
  total_discount: number;

  @Prop({ default: 0 })
  amount: number;

  @Prop({ default: 0 })
  paid_amount: number;

  @Prop({ default: 'draft' })
  status: string;

  // ── Vendor details (for PO invoices) ──
  @Prop()
  vendor_name: string;

  @Prop()
  vendor_id: string;

  @Prop()
  vendor_phone: string;

  @Prop()
  vendor_email: string;

  @Prop()
  vendor_address: string;

  // ── Customer details (for SO invoices) ──
  @Prop()
  customer_name: string;

  @Prop()
  customer_id: string;

  @Prop()
  customer_phone: string;

  @Prop()
  customer_email: string;

  @Prop()
  customer_address: string;

  // ── Source reference ──
  @Prop()
  source_type: string;

  @Prop()
  source_number: string;

  // ── Order metadata ──
  @Prop()
  order_date: string;

  @Prop()
  delivery_date: string;

  @Prop()
  payment_method: string;

  @Prop()
  shipping_address: string;

  @Prop()
  notes: string;

  // ── GST identity ────────────────────────────────────────────────────────
  /** Seller's GSTIN (hospital/entity issuing the invoice) */
  @Prop()
  seller_gstin: string;

  /** Buyer's GSTIN (vendor for PO invoices; customer GSTIN for B2B SO invoices) */
  @Prop()
  buyer_gstin: string;

  /** 2-digit state code of the place of supply (determines IGST vs CGST+SGST) */
  @Prop()
  place_of_supply: string;

  /** true = inter-state transaction → IGST applies; false = intra-state → CGST+SGST */
  @Prop({ default: false })
  is_inter_state: boolean;

  /** 'tax_invoice' (GST registered parties) | 'bill_of_supply' (exempt/composition) */
  @Prop({ default: 'tax_invoice' })
  invoice_type: string;

  /** Due date for payment */
  @Prop()
  due_date: string;

  // ── GST summary ──────────────────────────────────────────────────────────
  /** Per-slab breakdown: { rate, taxable_amount, cgst, sgst, igst, total_tax } */
  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  tax_breakdown: Record<string, any>[];

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  custom_fields: Record<string, any>;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
