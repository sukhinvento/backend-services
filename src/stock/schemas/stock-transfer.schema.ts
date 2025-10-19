import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type StockTransferDocument = StockTransfer & Document;

@Schema({ timestamps: true })
export class StockTransfer extends BaseSchema {
  @Prop({ required: true, unique: true })
  transfer_number: string;

  @Prop({ required: true })
  from_location_id: string;

  @Prop({ required: true })
  to_location_id: string;

  @Prop({ type: [MongooseSchema.Types.Mixed] })
  items: Record<string, any>[];

  @Prop({ required: true })
  status: 'draft' | 'pending' | 'in_transit' | 'completed' | 'cancelled';

  @Prop({ type: MongooseSchema.Types.Mixed })
  custom_fields: Record<string, any>;
}

export const StockTransferSchema = SchemaFactory.createForClass(StockTransfer);
