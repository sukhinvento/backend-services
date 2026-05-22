import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';

export type VendorDocument = Vendor & Document;

@Schema({ timestamps: true })
export class Vendor extends BaseSchema {
  @Prop({ required: true, unique: true })
  vendor_code: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  legal_name: string;

  // PII — encrypted at rest via encryptionPlugin; use tax_id_search_hash for HMAC lookups
  @Prop({ required: true })
  tax_id: string;

  // HMAC-SHA256 of plaintext tax_id for searchable lookups without exposing plaintext
  @Prop()
  tax_id_search_hash: string;

  // PII — encrypted at rest via encryptionPlugin
  @Prop()
  address: string;

  // PII — each element encrypted at rest via encryptionPlugin
  @Prop([String])
  contact_persons: string[];

  // NOTE: custom_fields.email and custom_fields.phone are also PII.
  // These should be encrypted/decrypted at the service layer using CryptoService
  // before writing to or reading from this field, because Mongoose Mixed type
  // prevents the encryptionPlugin from reaching nested keys automatically.

  @Prop()
  default_lead_time_days: number;

  @Prop()
  payment_terms: string;

  @Prop([String])
  supported_tax_slabs: string[];

  // Tax references - stores tax IDs from the Tax module
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Tax' }] })
  applicable_tax_ids: string[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Tax' })
  default_purchase_tax_id: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  custom_fields: Record<string, any>;

  @Prop({ required: true })
  tenantId: string;
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);

// Database indexes for optimal query performance
// Compound indexes for common query patterns
VendorSchema.index({ tenantId: 1, vendor_code: 1 }, { unique: true }); // Unique vendor_code per tenant
VendorSchema.index({ tenantId: 1, name: 1 }); // Tenant + name searches
VendorSchema.index({ tenantId: 1, 'custom_fields.status': 1 }); // Tenant + status filtering
VendorSchema.index({ tenantId: 1, 'custom_fields.category': 1 }); // Tenant + category filtering
VendorSchema.index({ tenantId: 1, applicable_tax_ids: 1 }); // Tenant + tax filtering
VendorSchema.index({ tenantId: 1, default_purchase_tax_id: 1 }); // Tenant + default tax filtering
VendorSchema.index({ tenantId: 1, payment_terms: 1 }); // Tenant + payment terms filtering
VendorSchema.index({ tenantId: 1, default_lead_time_days: 1 }); // Tenant + lead time filtering
VendorSchema.index({ tenantId: 1, createdAt: -1 }); // Tenant + date sorting
VendorSchema.index({ tenantId: 1, updatedAt: -1 }); // Tenant + last updated sorting

// Single field indexes for frequently searched fields
VendorSchema.index({ tax_id: 1 }); // Tax ID searches
VendorSchema.index({ name: 'text', legal_name: 'text', vendor_code: 'text' }); // Text search index
VendorSchema.index({ 'custom_fields.email': 1 }); // Email searches
VendorSchema.index({ 'custom_fields.phone': 1 }); // Phone searches
VendorSchema.index({ 'custom_fields.city': 1 }); // City filtering
VendorSchema.index({ 'custom_fields.state': 1 }); // State filtering
VendorSchema.index({ 'custom_fields.creditLimit': 1 }); // Credit limit filtering
VendorSchema.index({ 'custom_fields.outstandingBalance': 1 }); // Outstanding balance filtering
VendorSchema.index({ contact_persons: 1 }); // Contact person searches
