import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type TaxDocument = Tax & Document;

@Schema({ timestamps: true })
export class Tax extends BaseSchema {
  @Prop({ required: true })
  tax_code: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  rate: number; // Percentage rate (e.g., 18 for 18%)

  @Prop({ required: true, enum: ['percentage', 'fixed'] })
  rate_type: 'percentage' | 'fixed';

  @Prop({ 
    required: true, 
    enum: ['sales', 'purchase', 'both'],
    default: 'both'
  })
  applicable_on: 'sales' | 'purchase' | 'both';

  @Prop({ 
    required: true, 
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  })
  status: 'active' | 'inactive' | 'archived';

  @Prop()
  jurisdiction: string; // e.g., 'Federal', 'State', 'GST', 'VAT', etc.

  @Prop()
  tax_category: string; // e.g., 'GST', 'VAT', 'Sales Tax', 'Service Tax', etc.

  @Prop({ type: Date })
  effective_from: Date;

  @Prop({ type: Date })
  effective_to: Date;

  // Tax components for compound taxes (e.g., CGST + SGST)
  @Prop({ type: [MongooseSchema.Types.Mixed] })
  components: Array<{
    name: string;
    rate: number;
    description?: string;
  }>;

  // Priority for tax calculation order (lower number = higher priority)
  @Prop({ default: 0 })
  priority: number;

  // Whether this tax is included in price or added on top
  @Prop({ default: false })
  is_inclusive: boolean;

  // Whether this tax is compounded (calculated on subtotal + other taxes)
  @Prop({ default: false })
  is_compound: boolean;

  @Prop({ type: MongooseSchema.Types.Mixed })
  configuration: {
    min_amount?: number; // Minimum amount for tax to apply
    max_amount?: number; // Maximum amount for tax calculation
    exempt_threshold?: number; // Amount below which tax is exempt
    reverse_charge?: boolean; // For reverse charge mechanism
  };

  @Prop({ type: MongooseSchema.Types.Mixed })
  custom_fields: Record<string, any>;
}

export const TaxSchema = SchemaFactory.createForClass(Tax);

// Indexes for better query performance
TaxSchema.index({ tax_code: 1 }, { unique: true });
TaxSchema.index({ status: 1 });
TaxSchema.index({ applicable_on: 1 });
TaxSchema.index({ effective_from: 1, effective_to: 1 });

