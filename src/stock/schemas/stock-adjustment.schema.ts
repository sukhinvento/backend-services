import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type StockAdjustmentDocument = StockAdjustment & Document;

@Schema({ timestamps: true })
export class StockAdjustment extends BaseSchema {
  @Prop({ required: true, unique: true })
  adjustment_number: string;

  @Prop({ required: true })
  location_id: string;

  @Prop({ type: [MongooseSchema.Types.Mixed] })
  items: Record<string, any>[];

  @Prop({ required: true })
  status: 'draft' | 'pending' | 'applied' | 'cancelled';

  @Prop({ type: MongooseSchema.Types.Mixed })
  custom_fields: Record<string, any>;
}

export const StockAdjustmentSchema = SchemaFactory.createForClass(StockAdjustment);
