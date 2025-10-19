import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type SalesOrderDocument = SalesOrder & Document;

@Schema({ timestamps: true })
export class SalesOrder extends BaseSchema {
  @Prop({ required: true, unique: true })
  so_number: string;

  @Prop({ required: true })
  customer_id: string;

  @Prop({ type: [MongooseSchema.Types.Mixed] })
  items: Record<string, any>[];

  @Prop({ required: true })
  status: 'draft' | 'shipped' | 'invoiced';

  @Prop({ type: MongooseSchema.Types.Mixed })
  custom_fields: Record<string, any>;
}

export const SalesOrderSchema = SchemaFactory.createForClass(SalesOrder);
