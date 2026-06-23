import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type InventoryItemDocument = InventoryItem & Document;

@Schema({ timestamps: true })
export class InventoryItem extends BaseSchema {
  @Prop({ required: true })
  sku: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  category: string;

  @Prop()
  description: string;

  @Prop()
  unit_of_measure: string;

  @Prop()
  sale_unit: string;

  @Prop()
  unit_price: number;

  @Prop({ default: 0 })
  current_stock: number;

  @Prop({ default: 0 })
  min_stock_level: number;

  @Prop({ default: 0 })
  max_stock_level: number;

  @Prop()
  reorder_quantity: number;

  @Prop()
  supplier: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Vendor' })
  supplier_id: MongooseSchema.Types.ObjectId;

  @Prop()
  manufacturer: string;

  @Prop()
  location: string;

  @Prop()
  batch_number: string;

  @Prop()
  expiry_date: string;

  /** HSN code (Harmonised System of Nomenclature) for goods — required for GST invoice */
  @Prop()
  hsn_code: string;

  /** SAC code (Services Accounting Code) — for service items */
  @Prop()
  sac_code: string;

  @Prop()
  barcode: string;

  @Prop()
  rfid_tag: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Tax' }] })
  applicable_tax_ids: MongooseSchema.Types.ObjectId[];

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  custom_fields: Record<string, any>;
}

export const InventoryItemSchema = SchemaFactory.createForClass(InventoryItem);

InventoryItemSchema.index({ tenantId: 1, sku: 1 }, { unique: true });
InventoryItemSchema.index({ tenantId: 1, category: 1 });
InventoryItemSchema.index({ tenantId: 1, is_active: 1 });
InventoryItemSchema.index({ tenantId: 1, current_stock: 1 });
