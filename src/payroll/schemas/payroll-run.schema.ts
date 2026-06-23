import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type PayrollRunDocument = PayrollRun & Document;

export class PayrollEntry {
  employee_salary_id: string;
  employee_name: string;
  designation: string;
  gross: number;
  deductions: number;
  net: number;
  paid: boolean;
}

@Schema({ timestamps: true })
export class PayrollRun extends BaseSchema {
  /** YYYY-MM format, e.g. "2026-06" */
  @Prop({ required: true })
  payroll_period: string;

  @Prop({ type: Date, required: true })
  run_date: Date;

  @Prop({
    required: true,
    enum: ['draft', 'processed', 'paid'],
    default: 'draft',
  })
  status: string;

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  entries: PayrollEntry[];

  @Prop({ default: 0 })
  total_gross: number;

  @Prop({ default: 0 })
  total_deductions: number;

  @Prop({ default: 0 })
  total_net: number;

  /** FK to the journal entry created when payroll is processed */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'JournalEntry' })
  journal_entry_id: string;

  /** FK to the payment journal entry created when payroll is paid */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'JournalEntry' })
  payment_journal_entry_id: string;

  @Prop({ required: true, index: true })
  tenantId: string;
}

export const PayrollRunSchema = SchemaFactory.createForClass(PayrollRun);
PayrollRunSchema.index({ tenantId: 1, payroll_period: 1 }, { unique: true });
