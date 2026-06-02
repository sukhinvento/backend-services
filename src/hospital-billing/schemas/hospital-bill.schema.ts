import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type HospitalBillDocument = HospitalBill & Document;

const LineItemSchema = new MongooseSchema(
  {
    description: String,
    category: {
      type: String,
      enum: ['room_charges', 'procedure', 'medication', 'diagnostic', 'consultation', 'other'],
    },
    quantity: { type: Number, default: 1 },
    unit_price: { type: Number, default: 0 },
    discount_percent: { type: Number, default: 0 },
    tax_ids: [{ type: MongooseSchema.Types.ObjectId, ref: 'Tax' }],
    subtotal: { type: Number, default: 0 },
    tax_amount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false },
);

@Schema({ timestamps: true })
export class HospitalBill extends BaseSchema {
  @Prop({ required: true })
  invoice_number: string; // unique per tenant, auto-gen HINV-XXXX

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Patient', required: true })
  patient_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Admission' })
  admission_id: MongooseSchema.Types.ObjectId;

  /** Generic link back to the source entity (diagnostic booking id, admission id, etc.)
   *  Used to sync payment status to the corresponding invoice. */
  @Prop()
  source_entity_id: string;

  @Prop({ type: [LineItemSchema], default: [] })
  line_items: {
    description: string;
    category: string;
    quantity: number;
    unit_price: number;
    discount_percent: number;
    tax_ids: string[];
    subtotal: number;
    tax_amount: number;
    total: number;
  }[];

  @Prop({ default: 0 })
  subtotal: number;

  @Prop({ default: 0 })
  total_tax: number;

  @Prop({ default: 0 })
  total_discount: number;

  @Prop({ default: 0 })
  grand_total: number;

  @Prop({
    type: String,
    enum: ['draft', 'issued', 'partially_paid', 'paid', 'cancelled', 'overdue'],
    default: 'draft',
  })
  status: string;

  @Prop()
  payment_mode: string;

  @Prop({ default: 0 })
  paid_amount: number;

  @Prop({ type: Date })
  due_date: Date;

  @Prop({ type: Date })
  issued_date: Date;

  @Prop()
  notes: string;

  @Prop({ required: true, index: true })
  tenantId: string;
}

export const HospitalBillSchema = SchemaFactory.createForClass(HospitalBill);

HospitalBillSchema.index({ tenantId: 1, invoice_number: 1 }, { unique: true });
HospitalBillSchema.index({ tenantId: 1, status: 1 });
HospitalBillSchema.index({ tenantId: 1, patient_id: 1 });
