import { Injectable } from '@nestjs/common';
import { Model, Schema } from 'mongoose';
import { QueryDto } from '../dto/query.dto';

export interface FieldMappingConfig {
  rootFields: string[];
  customFieldPrefix: string;
  fieldAliases: Record<string, string>;
  customFieldMappings: Record<string, string>;
}

export interface FilterOperator {
  $eq?: any;
  $ne?: any;
  $gt?: any;
  $gte?: any;
  $lt?: any;
  $lte?: any;
  $in?: any[];
  $nin?: any[];
  $regex?: string;
  $options?: string;
  $exists?: boolean;
}

@Injectable()
export class EnhancedQueryBuilderService<T> {
  protected getFieldMappingConfig(model: Model<T>): FieldMappingConfig {
    const schemaPaths = Object.keys(model.schema.paths);
    
    return {
      rootFields: schemaPaths.filter(path => path !== 'custom_fields'),
      customFieldPrefix: 'custom_',
      fieldAliases: {
        // Add common aliases here
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
      },
      customFieldMappings: {
        // Add custom field mappings here
        // These will be mapped to custom_fields.field_name
      }
    };
  }

  private isCustomField(fieldName: string, config: FieldMappingConfig): boolean {
    return fieldName.startsWith(config.customFieldPrefix) || 
           !config.rootFields.includes(fieldName) && 
           !config.fieldAliases[fieldName];
  }

  private resolveFieldName(fieldName: string, config: FieldMappingConfig): string {
    // Check if it's an alias first
    if (config.fieldAliases[fieldName]) {
      return config.fieldAliases[fieldName];
    }

    // Check if it's a custom field
    if (this.isCustomField(fieldName, config)) {
      const customFieldName = fieldName.startsWith(config.customFieldPrefix) 
        ? fieldName.substring(config.customFieldPrefix.length)
        : fieldName;
      
      return `custom_fields.${customFieldName}`;
    }

    // Return as-is if it's a root field
    return fieldName;
  }

  private parseFilterValue(value: any): any {
    // Handle special operators
    if (typeof value === 'object' && value !== null) {
      const operators: FilterOperator = {};
      
      for (const [key, val] of Object.entries(value)) {
        switch (key) {
          case 'eq':
            operators.$eq = val;
            break;
          case 'ne':
            operators.$ne = val;
            break;
          case 'gt':
            operators.$gt = val;
            break;
          case 'gte':
            operators.$gte = val;
            break;
          case 'lt':
            operators.$lt = val;
            break;
          case 'lte':
            operators.$lte = val;
            break;
          case 'in':
            operators.$in = Array.isArray(val) ? val : [val];
            break;
          case 'nin':
            operators.$nin = Array.isArray(val) ? val : [val];
            break;
          case 'regex':
            operators.$regex = String(val);
            break;
          case 'options':
            operators.$options = String(val);
            break;
          case 'exists':
            operators.$exists = Boolean(val);
            break;
          default:
            // If it's not a known operator, treat as direct value
            return value;
        }
      }
      
      // Return the operators object if any were found
      return Object.keys(operators).length > 0 ? operators : value;
    }

    // Handle string patterns for partial matching
    if (typeof value === 'string' && value.includes('*')) {
      return {
        $regex: value.replace(/\*/g, '.*'),
        $options: 'i'
      };
    }

    return value;
  }

  private buildMongoQuery(filter: Record<string, any>, config: FieldMappingConfig): Record<string, any> {
    const mongoQuery: Record<string, any> = {};

    for (const [fieldName, value] of Object.entries(filter)) {
      const resolvedFieldName = this.resolveFieldName(fieldName, config);
      const parsedValue = this.parseFilterValue(value);
      
      mongoQuery[resolvedFieldName] = parsedValue;
    }

    return mongoQuery;
  }

  buildQuery(model: Model<T>, queryDto: QueryDto) {
    const { page = 1, limit = 10, sort, filter } = queryDto;
    const config = this.getFieldMappingConfig(model);

    const query = model.find();

    if (filter) {
      const mongoQuery = this.buildMongoQuery(filter, config);
      query.where(mongoQuery);
    }

    if (sort) {
      const sortFields = sort.split(',').map(sortField => {
        const [field, order] = sortField.split('_');
        const resolvedField = this.resolveFieldName(field, config);
        return { [resolvedField]: order === 'desc' ? -1 : 1 };
      });
      
      const sortObject = sortFields.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      query.sort(sortObject as any);
    }

    query.skip((page - 1) * limit).limit(limit);

    return query;
  }

  // Method to get available filter fields for API documentation
  getAvailableFilterFields(model: Model<T>): {
    rootFields: string[];
    customFields: string[];
    aliases: Record<string, string>;
  } {
    const config = this.getFieldMappingConfig(model);
    
    return {
      rootFields: config.rootFields,
      customFields: Object.keys(config.customFieldMappings),
      aliases: config.fieldAliases
    };
  }
}
