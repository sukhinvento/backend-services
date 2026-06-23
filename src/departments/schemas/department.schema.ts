import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type DepartmentDocument = Department & Document;

@Schema({ timestamps: true })
export class Department extends BaseSchema {
  /** Human-readable name, e.g. "Cardiology" */
  @Prop({ required: true })
  name: string;

  /** Short code for tokens / prefixes, e.g. "CARD" */
  @Prop()
  code: string;

  /** Optional longer description */
  @Prop()
  description: string;

  /** Hex colour used in the UI badge, e.g. "#0ea5e9" */
  @Prop()
  color: string;

  @Prop({
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: string;

  /** Tenant-configurable extra fields */
  @Prop({ type: MongooseSchema.Types.Mixed })
  custom_fields: Record<string, any>;

  @Prop({ required: true, index: true })
  tenantId: string;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);

// Unique department name within a tenant
DepartmentSchema.index({ tenantId: 1, name: 1 }, { unique: true });
DepartmentSchema.index({ tenantId: 1, status: 1 });
