import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type InvoiceDocument = Invoice & Document;

@Schema({ timestamps: true })
export class Invoice extends BaseSchema {
  @Prop({ required: true, unique: true })
  invoice_number: string;

  @Prop({ required: true })
  order_id: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  status: 'draft' | 'paid';

  @Prop({ type: MongooseSchema.Types.Mixed })
  custom_fields: Record<string, any>;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
