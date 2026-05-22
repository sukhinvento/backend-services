import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type StockAdjustmentDocument = StockAdjustment & Document;

@Schema({ timestamps: true })
export class StockAdjustment extends BaseSchema {
  @Prop({ required: true })
  adjustment_number: string;

  @Prop()
  location_id: string;

  @Prop()
  location: string;

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  items: Record<string, any>[];

  @Prop({ default: 'draft' })
  status: string;

  @Prop()
  notes: string;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  custom_fields: Record<string, any>;
}

export const StockAdjustmentSchema = SchemaFactory.createForClass(StockAdjustment);
StockAdjustmentSchema.index({ tenantId: 1, adjustment_number: 1 }, { unique: true });
StockAdjustmentSchema.index({ tenantId: 1, status: 1 });
