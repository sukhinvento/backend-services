import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type EmployeeSalaryDocument = EmployeeSalary & Document;

@Schema({ timestamps: true })
export class EmployeeSalary extends BaseSchema {
  /** FK to Doctor or staff — can be any staff member */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Doctor' })
  doctor_id: string;

  @Prop({ required: true })
  employee_name: string;

  @Prop({ required: true })
  designation: string;

  @Prop({ required: true, default: 0 })
  basic_salary: number;

  @Prop({ default: 0 })
  hra: number;

  @Prop({ default: 0 })
  special_allowance: number;

  @Prop({ default: 0 })
  pf_deduction: number;

  @Prop({ default: 0 })
  tax_deduction: number;

  /** Computed: basic_salary + hra + special_allowance - pf_deduction - tax_deduction */
  @Prop({ default: 0 })
  net_salary: number;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ required: true, index: true })
  tenantId: string;
}

export const EmployeeSalarySchema = SchemaFactory.createForClass(EmployeeSalary);
EmployeeSalarySchema.index({ tenantId: 1, doctor_id: 1 });
