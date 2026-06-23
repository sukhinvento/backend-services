import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type JournalEntryDocument = JournalEntry & Document;

// ── Journal line (one debit or credit posting) ────────────────────────────
export class JournalLine {
  account_id:   string;
  account_code: string;
  account_name: string;
  description:  string;
  debit:        number;   // 0 if credit entry
  credit:       number;   // 0 if debit entry
}

// ── Journal entry ─────────────────────────────────────────────────────────
@Schema({ timestamps: true })
export class JournalEntry extends BaseSchema {
  /** Sequential entry number per tenant: JE-0001, JE-0002 … */
  @Prop({ required: true })
  entry_number: string;

  @Prop({ type: Date, required: true })
  entry_date: Date;

  @Prop({ required: true })
  description: string;

  /**
   * invoice_po | invoice_so | invoice_diagnostic | invoice_admission |
   * payment_received | payment_made | manual | depreciation | adjustment
   */
  @Prop({ required: true })
  reference_type: string;

  /** ID of the source document (invoice _id, etc.) */
  @Prop()
  reference_id: string;

  /** Human-readable reference: invoice number, PO number, etc. */
  @Prop()
  reference_number: string;

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  lines: JournalLine[];

  @Prop({ default: 0 })
  total_debit: number;

  @Prop({ default: 0 })
  total_credit: number;

  /**
   * draft  — created but not yet affecting balances
   * posted — balances updated (immutable after this point)
   * reversed — reversed by a reversal entry
   */
  @Prop({ default: 'posted', enum: ['draft', 'posted', 'reversed'] })
  status: string;

  /** ID of the reversal entry if this was reversed */
  @Prop()
  reversal_of: string;

  @Prop({ required: true, index: true })
  tenantId: string;
}

export const JournalEntrySchema = SchemaFactory.createForClass(JournalEntry);
JournalEntrySchema.index({ tenantId: 1, entry_number: 1 }, { unique: true });
JournalEntrySchema.index({ tenantId: 1, reference_id: 1 });
JournalEntrySchema.index({ tenantId: 1, entry_date: 1 });
JournalEntrySchema.index({ tenantId: 1, reference_type: 1 });
