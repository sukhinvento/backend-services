import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type StockTransferDocument = StockTransfer & Document;

@Schema({ timestamps: true })
export class StockTransfer extends BaseSchema {
  @Prop({ required: true })
  transfer_number: string;

  @Prop()
  from_location_id: string;

  @Prop()
  from_location: string;

  @Prop()
  to_location_id: string;

  @Prop()
  to_location: string;

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  items: Record<string, any>[];

  @Prop({ default: 'draft' })
  status: string;

  @Prop()
  notes: string;

  @Prop({ default: 'low' })
  priority: string;

  @Prop()
  expected_date: string;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  custom_fields: Record<string, any>;
}

export const StockTransferSchema = SchemaFactory.createForClass(StockTransfer);
StockTransferSchema.index({ tenantId: 1, transfer_number: 1 }, { unique: true });
StockTransferSchema.index({ tenantId: 1, status: 1 });
