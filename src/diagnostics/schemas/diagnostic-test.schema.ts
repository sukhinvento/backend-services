import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type DiagnosticTestDocument = DiagnosticTest & Document;

@Schema({ timestamps: true })
export class DiagnosticTest extends BaseSchema {
  @Prop({ required: true })
  test_code: string; // unique per tenant

  @Prop({ required: true })
  name: string;

  @Prop()
  category: string;

  @Prop()
  price: number;

  @Prop()
  duration_minutes: number;

  @Prop()
  preparation_instructions: string;

  @Prop()
  department: string;

  @Prop()
  description: string;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ required: true, index: true })
  tenantId: string;
}

export const DiagnosticTestSchema = SchemaFactory.createForClass(DiagnosticTest);

DiagnosticTestSchema.index({ tenantId: 1, test_code: 1 }, { unique: true });
DiagnosticTestSchema.index({ tenantId: 1, category: 1 });
DiagnosticTestSchema.index({ tenantId: 1, is_active: 1 });
