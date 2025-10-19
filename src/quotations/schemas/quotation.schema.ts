import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type QuotationDocument = Quotation & Document;

@Schema({ timestamps: true })
export class Quotation extends BaseSchema {
  @Prop({ required: true, unique: true })
  quotation_number: string;

  @Prop({ required: true })
  vendor_id: string;

  @Prop({ required: true })
  customer_id: string;

  @Prop({ type: [MongooseSchema.Types.Mixed] })
  items: Record<string, any>[];

  @Prop({ required: true })
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';

  @Prop({ required: true })
  valid_until: Date;

  @Prop()
  remarks?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  custom_fields: Record<string, any>;

  @Prop({ type: MongooseSchema.Types.Mixed })
  pricing: {
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    currency: string;
  };

  @Prop({ type: MongooseSchema.Types.Mixed })
  terms: {
    payment_terms: string;
    delivery_terms: string;
    validity_days: number;
  };
}

export const QuotationSchema = SchemaFactory.createForClass(Quotation);
