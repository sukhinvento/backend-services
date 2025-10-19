import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type FulfillmentDocument = Fulfillment & Document;

@Schema({ timestamps: true })
export class Fulfillment extends BaseSchema {
  @Prop({ required: true, unique: true })
  fulfillment_number: string;

  @Prop({ required: true })
  po_id: string;

  @Prop({ type: [MongooseSchema.Types.Mixed] })
  items: Record<string, any>[];

  @Prop({ required: true })
  status: 'draft' | 'partial' | 'complete' | 'discrepancy';

  @Prop({ type: MongooseSchema.Types.Mixed })
  custom_fields: Record<string, any>;
}

export const FulfillmentSchema = SchemaFactory.createForClass(Fulfillment);
