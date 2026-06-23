import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type InventoryLocationDocument = InventoryLocation & Document;

@Schema({ timestamps: true })
export class InventoryLocation {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'InventoryItem', required: true })
  inventory_item_id: MongooseSchema.Types.ObjectId;

  /**
   * References a Location document when a formal location exists,
   * or holds a stable slug string (e.g. "loc-main-pharmacy-tenant") when
   * the delivery address is free-text (no Location record created yet).
   * Using Mixed allows both ObjectId and string values.
   */
  @Prop({ type: MongooseSchema.Types.Mixed })
  location_id: MongooseSchema.Types.ObjectId | string;

  @Prop({ required: true })
  location_name: string;

  @Prop()
  sub_location: string;

  @Prop({ default: 0 })
  quantity: number;

  @Prop({ required: true, index: true })
  tenantId: string;
}

export const InventoryLocationSchema = SchemaFactory.createForClass(InventoryLocation);
// Unique per item+location name+sub-location within a tenant
InventoryLocationSchema.index(
  { tenantId: 1, inventory_item_id: 1, location_name: 1, sub_location: 1 },
  { unique: true, sparse: true },
);
InventoryLocationSchema.index({ tenantId: 1, location_id: 1 });
