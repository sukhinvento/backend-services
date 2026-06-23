import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type BankTransactionDocument = BankTransaction & Document;

@Schema({ timestamps: true })
export class BankTransaction extends BaseSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'BankAccount', required: true })
  bank_account_id: string;

  @Prop({ type: Date, required: true })
  transaction_date: Date;

  @Prop({ required: true })
  description: string;

  @Prop()
  reference_number: string;

  @Prop({ default: 0 })
  debit: number;

  @Prop({ default: 0 })
  credit: number;

  @Prop({ default: 0 })
  running_balance: number;

  @Prop({ default: false })
  is_reconciled: boolean;

  @Prop({ type: Date })
  reconciled_date: Date;

  /** FK to the journal entry that this transaction is linked to */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'JournalEntry' })
  journal_entry_id: string;

  @Prop({ required: true, index: true })
  tenantId: string;
}

export const BankTransactionSchema = SchemaFactory.createForClass(BankTransaction);
BankTransactionSchema.index({ tenantId: 1, bank_account_id: 1, transaction_date: -1 });
