import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type PurchaseOrderDocument = PurchaseOrder & Document;

@Schema({ timestamps: true })
export class PurchaseOrder extends BaseSchema {
  @Prop({ required: true, unique: true })
  po_number: string;

  @Prop({ required: true })
  vendor_id: string;

  @Prop({ type: [MongooseSchema.Types.Mixed] })
  items: Record<string, any>[];

  @Prop({ required: true })
  status: 'draft' | 'approved' | 'fulfilled';

  @Prop({ type: MongooseSchema.Types.Mixed })
  custom_fields: Record<string, any>;
}

export const PurchaseOrderSchema = SchemaFactory.createForClass(PurchaseOrder);
