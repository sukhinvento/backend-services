import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type FixedAssetDocument = FixedAsset & Document;

@Schema({ timestamps: true })
export class FixedAsset extends BaseSchema {
  @Prop({ required: true })
  asset_code: string;

  @Prop({ required: true })
  asset_name: string;

  @Prop({ required: true })
  category: string;

  @Prop({ type: Date, required: true })
  purchase_date: Date;

  @Prop({ required: true })
  purchase_cost: number;

  @Prop({ required: true })
  useful_life_years: number;

  @Prop({
    required: true,
    enum: ['straight_line', 'wdv'],
    default: 'straight_line',
  })
  depreciation_method: string;

  @Prop({ default: 0 })
  salvage_value: number;

  @Prop({ default: 0 })
  accumulated_depreciation: number;

  /** purchase_cost - accumulated_depreciation */
  @Prop({ default: 0 })
  net_book_value: number;

  /** FK to Account — the asset account in CoA (e.g. "Medical Equipment") */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account' })
  linked_account_id: string;

  /** FK to Account — the depreciation expense account (e.g. "Depreciation — Equipment") */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account' })
  depreciation_account_id: string;

  /** FK to Account — the accumulated depreciation contra-asset account */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account' })
  accumulated_depreciation_account_id: string;

  @Prop({
    required: true,
    enum: ['active', 'disposed', 'fully_depreciated'],
    default: 'active',
  })
  status: string;

  @Prop({ required: true, index: true })
  tenantId: string;
}

export const FixedAssetSchema = SchemaFactory.createForClass(FixedAsset);
FixedAssetSchema.index({ tenantId: 1, asset_code: 1 }, { unique: true });
