import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type SalesOrderDocument = SalesOrder & Document;

@Schema({ timestamps: true })
export class SalesOrder extends BaseSchema {
  @Prop({ required: true })
  so_number: string;

  @Prop()
  customer_id: string;

  @Prop()
  customer_name: string;

  @Prop()
  customer_email: string;

  @Prop()
  customer_phone: string;

  @Prop()
  customer_address: string;

  @Prop()
  shipping_address: string;

  @Prop()
  billing_address: string;

  @Prop()
  order_date: string;

  @Prop()
  due_date: string;

  @Prop()
  delivery_date: string;

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  items: Record<string, any>[];

  @Prop({ default: 0 })
  grand_total: number;

  @Prop({ default: 0 })
  paid_amount: number;

  @Prop()
  payment_method: string;

  @Prop({ default: 'Pending' })
  payment_status: string;

  @Prop({ default: 'draft' })
  status: string;

  @Prop()
  notes: string;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  custom_fields: Record<string, any>;
}

export const SalesOrderSchema = SchemaFactory.createForClass(SalesOrder);
SalesOrderSchema.index({ tenantId: 1, so_number: 1 }, { unique: true });
SalesOrderSchema.index({ tenantId: 1, status: 1 });
