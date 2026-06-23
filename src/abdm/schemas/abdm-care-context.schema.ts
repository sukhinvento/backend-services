import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type AbdmCareContextDocument = AbdmCareContext & Document;

/**
 * Stores every ABDM care context that has been linked to a patient's ABHA.
 * This is the audit trail of all health records shared with the ABDM ecosystem.
 */
@Schema({ timestamps: true })
export class AbdmCareContext extends BaseSchema {
  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true, index: true })
  patientId: string;      // FK → Patient._id

  @Prop({ required: true, index: true })
  abhaAddress: string;    // e.g. "john.doe@abdm"

  @Prop({ required: true, enum: ['admission', 'diagnostic', 'opd', 'prescription'] })
  contextType: string;

  @Prop({ required: true })
  referenceNumber: string;  // e.g. ADM-2026-001, DIAG-2026-005

  @Prop({ required: true })
  display: string;          // human-readable: "IPD Admission - 3 Jun 2026"

  @Prop({ default: 'SUCCESS' })
  status: string;           // SUCCESS | FAILED | PENDING

  @Prop()
  fhirBundleId: string;     // set when FHIR bundle is generated

  @Prop({ default: false })
  isMockRecord: boolean;    // true if generated in mock mode
}

export const AbdmCareContextSchema = SchemaFactory.createForClass(AbdmCareContext);
AbdmCareContextSchema.index({ tenantId: 1, patientId: 1 });
AbdmCareContextSchema.index({ tenantId: 1, abhaAddress: 1 });
