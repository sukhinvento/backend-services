import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type BankAccountDocument = BankAccount & Document;

@Schema({ timestamps: true })
export class BankAccount extends BaseSchema {
  @Prop({ required: true })
  bank_name: string;

  @Prop({ required: true })
  account_number: string;

  @Prop()
  ifsc_code: string;

  @Prop({
    required: true,
    enum: ['savings', 'current', 'overdraft'],
    default: 'current',
  })
  account_type: string;

  /** FK to the Chart of Accounts entry (e.g. "Cash and Bank" or a sub-account) */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account' })
  linked_account_id: string;

  @Prop({ default: 0 })
  balance: number;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ required: true, index: true })
  tenantId: string;
}

export const BankAccountSchema = SchemaFactory.createForClass(BankAccount);
BankAccountSchema.index({ tenantId: 1, account_number: 1 }, { unique: true });
