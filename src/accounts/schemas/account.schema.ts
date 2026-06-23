import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type AccountDocument = Account & Document;

// ── Account types ──────────────────────────────────────────────────────────
export enum AccountType {
  ASSET     = 'asset',
  LIABILITY = 'liability',
  EQUITY    = 'equity',
  REVENUE   = 'revenue',
  EXPENSE   = 'expense',
}

// Normal balance direction per account type
// ASSET + EXPENSE: Debit increases; LIABILITY + EQUITY + REVENUE: Credit increases
export const DEBIT_NORMAL = [AccountType.ASSET, AccountType.EXPENSE];
export const CREDIT_NORMAL = [AccountType.LIABILITY, AccountType.EQUITY, AccountType.REVENUE];

// ── Schema ─────────────────────────────────────────────────────────────────
@Schema({ timestamps: true })
export class Account extends BaseSchema {
  /** e.g. "1001", "4003" — unique within a tenant */
  @Prop({ required: true })
  account_code: string;

  @Prop({ required: true })
  account_name: string;

  @Prop({ required: true, enum: Object.values(AccountType) })
  account_type: AccountType;

  /**
   * current_asset | fixed_asset | current_liability | long_term_liability |
   * equity | operating_revenue | other_revenue | cost_of_goods |
   * operating_expense | non_cash_expense | tax_liability
   */
  @Prop()
  account_sub_type: string;

  @Prop()
  description: string;

  /** Pointer to a parent account for hierarchical CoA */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account' })
  parent_account_id: string;

  /** Running balance (updated atomically when journal entries are posted) */
  @Prop({ default: 0 })
  balance: number;

  /** System accounts cannot be deleted or renamed */
  @Prop({ default: false })
  is_system: boolean;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ required: true, index: true })
  tenantId: string;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
AccountSchema.index({ tenantId: 1, account_code: 1 }, { unique: true });
AccountSchema.index({ tenantId: 1, account_type: 1 });
