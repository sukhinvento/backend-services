import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type InventoryBatchDocument = InventoryBatch & Document;

@Schema({ timestamps: true })
export class InventoryBatch {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'InventoryItem', required: true })
  inventory_item_id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  batch_number: string;

  @Prop()
  expiry_date: string;

  @Prop({ default: 0 })
  quantity: number;

  @Prop({ default: 0 })
  used_quantity: number;

  @Prop()
  received_date: string;

  /** Source PO that delivered this batch */
  @Prop()
  po_number: string;

  @Prop()
  po_id: string;

  @Prop()
  manufacturer: string;

  @Prop()
  location_name: string;

  @Prop()
  unit_cost: number;

  @Prop({ default: 'active', enum: ['active', 'expired', 'depleted', 'recalled'] })
  status: string;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop()
  createdBy: string;

  @Prop()
  updatedBy: string;
}

export const InventoryBatchSchema = SchemaFactory.createForClass(InventoryBatch);
InventoryBatchSchema.index({ tenantId: 1, inventory_item_id: 1, batch_number: 1 }, { unique: true });
InventoryBatchSchema.index({ tenantId: 1, expiry_date: 1 });
InventoryBatchSchema.index({ tenantId: 1, status: 1 });
