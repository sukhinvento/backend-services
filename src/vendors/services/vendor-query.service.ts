import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { Vendor, VendorDocument } from '../schemas/vendor.schema';
import { EnhancedQueryBuilderService, FieldMappingConfig } from '@common/services/enhanced-query-builder.service';

@Injectable()
export class VendorQueryService extends EnhancedQueryBuilderService<VendorDocument> {
  protected getFieldMappingConfig(model: Model<VendorDocument>): FieldMappingConfig {
    return {
      rootFields: [
        'vendor_code',
        'name',
        'legal_name',
        'tax_id',
        'address',
        'contact_persons',
        'default_lead_time_days',
        'payment_terms',
        'supported_tax_slabs',
        'applicable_tax_ids',
        'default_purchase_tax_id',
        'tenantId',
        'createdAt',
        'updatedAt',
        'createdBy',
        'updatedBy'
      ],
      customFieldPrefix: 'custom_',
      fieldAliases: {
        // Common aliases for vendor fields
        'vendorCode': 'vendor_code',
        'vendorName': 'name',
        'legalName': 'legal_name',
        'taxId': 'tax_id',
        'leadTime': 'default_lead_time_days',
        'paymentTerms': 'payment_terms',
        'taxSlabs': 'supported_tax_slabs',
        'contactPersons': 'contact_persons',
        'applicableTaxIds': 'applicable_tax_ids',
        'defaultPurchaseTaxId': 'default_purchase_tax_id',
        'createdAt': 'createdAt',
        'updatedAt': 'updatedAt',
        'createdBy': 'createdBy',
        'updatedBy': 'updatedBy'
      },
      customFieldMappings: {
        // Add common custom field mappings
        'category': 'category',
        'rating': 'rating',
        'priority': 'priority',
        'notes': 'notes',
        'tags': 'tags',
        'status': 'status',
        'region': 'region',
        'industry': 'industry',
        'certification': 'certification',
        'compliance': 'compliance'
      }
    };
  }

  // Vendor-specific query methods
  async searchVendors(
    model: Model<VendorDocument>,
    searchTerm: string,
    tenantId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const searchQuery = {
      $and: [
        { tenantId },
        {
          $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { legal_name: { $regex: searchTerm, $options: 'i' } },
            { vendor_code: { $regex: searchTerm, $options: 'i' } },
            { address: { $regex: searchTerm, $options: 'i' } },
            { 'custom_fields.name': { $regex: searchTerm, $options: 'i' } },
            { 'custom_fields.description': { $regex: searchTerm, $options: 'i' } }
          ]
        }
      ]
    };

    return model
      .find(searchQuery)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  }

  async getVendorsByTaxSlab(
    model: Model<VendorDocument>,
    taxSlab: string,
    tenantId: string
  ) {
    return model
      .find({
        tenantId,
        supported_tax_slabs: { $in: [taxSlab] }
      })
      .exec();
  }

  async getVendorsByLeadTime(
    model: Model<VendorDocument>,
    maxLeadTime: number,
    tenantId: string
  ) {
    return model
      .find({
        tenantId,
        default_lead_time_days: { $lte: maxLeadTime }
      })
      .exec();
  }
}
