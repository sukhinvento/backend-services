import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';
import {
  FieldConfiguration,
  FieldConfigurationSchema,
} from './field-configuration.schema';

export type TenantDocument = Tenant & Document;

@Schema({ timestamps: true })
export class Tenant extends BaseSchema {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ unique: true, sparse: true, index: true })
  tenantId: string;

  @Prop({ type: Map, of: [FieldConfigurationSchema] })
  fieldConfigurations: Map<string, FieldConfiguration[]>;

  /**
   * Feature flag overrides for this specific tenant.
   * Supports any key; known keys:
   *   abdm_enabled: boolean  — override ABDM_ENABLED env for this tenant
   *   abdm_mock: boolean     — override ABDM_MOCK env for this tenant
   */
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  config: Record<string, any>;

  // ── GST / tax registration ──────────────────────────────────────────────
  /** Hospital's GSTIN (e.g. 27AAAAA0000A1Z5) */
  @Prop()
  gstin: string;

  /** Legal entity name as per GST registration */
  @Prop()
  legal_name: string;

  /** Registered address for GST */
  @Prop()
  registered_address: string;

  /** 2-digit state code (e.g. "27" Maharashtra, "07" Delhi) — drives IGST vs CGST+SGST */
  @Prop()
  state_code: string;

  /** PAN of the entity */
  @Prop()
  pan: string;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
