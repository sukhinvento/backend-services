# Dynamic Field Mapping & Filtering Guide

## Overview

This guide explains how to use the enhanced filtering system for vendors and other entities. The system supports filtering on both root-level fields and custom fields with advanced operators.

## API Endpoints

### 1. Standard Filtering
```
GET /vendors?filter={"name":"ABC Corp","vendorCode":"V001"}
```

### 2. Search
```
GET /vendors/search?q=ABC&page=1&limit=10
```

### 3. Specialized Queries
```
GET /vendors/by-tax-slab/18%
GET /vendors/by-lead-time/7
```

### 4. Available Filter Fields
```
GET /vendors/filter-fields
```

## Filter Syntax

### Basic Filtering
```json
{
  "filter": {
    "name": "ABC Corporation",
    "vendorCode": "V001",
    "taxId": "TAX123456"
  }
}
```

### Advanced Operators
```json
{
  "filter": {
    "name": {
      "regex": "ABC.*",
      "options": "i"
    },
    "default_lead_time_days": {
      "gte": 5,
      "lte": 15
    },
    "supported_tax_slabs": {
      "in": ["18%", "12%", "5%"]
    }
  }
}
```

### Custom Fields Filtering
```json
{
  "filter": {
    "custom_category": "Pharmaceutical",
    "custom_rating": {
      "gte": 4
    },
    "custom_status": "active"
  }
}
```

### Field Aliases
```json
{
  "filter": {
    "vendorName": "ABC Corp",        // Maps to 'name'
    "vendorCode": "V001",            // Maps to 'vendor_code'
    "leadTime": 10,                  // Maps to 'default_lead_time_days'
    "taxSlabs": ["18%", "12%"]       // Maps to 'supported_tax_slabs'
  }
}
```

## Supported Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equals | `{"name": {"eq": "ABC Corp"}}` |
| `ne` | Not equals | `{"name": {"ne": "XYZ Corp"}}` |
| `gt` | Greater than | `{"leadTime": {"gt": 5}}` |
| `gte` | Greater than or equal | `{"leadTime": {"gte": 5}}` |
| `lt` | Less than | `{"leadTime": {"lt": 15}}` |
| `lte` | Less than or equal | `{"leadTime": {"lte": 15}}` |
| `in` | In array | `{"taxSlabs": {"in": ["18%", "12%"]}}` |
| `nin` | Not in array | `{"taxSlabs": {"nin": ["0%"]}}` |
| `regex` | Regular expression | `{"name": {"regex": "ABC.*"}}` |
| `exists` | Field exists | `{"custom_rating": {"exists": true}}` |

## Field Mapping

### Root Fields
- `vendor_code` - Vendor code
- `name` - Vendor name
- `legal_name` - Legal name
- `tax_id` - Tax ID
- `address` - Address
- `contact_persons` - Contact persons array
- `default_lead_time_days` - Lead time in days
- `payment_terms` - Payment terms
- `supported_tax_slabs` - Supported tax slabs array
- `applicable_tax_ids` - Applicable tax IDs
- `default_purchase_tax_id` - Default purchase tax ID
- `tenantId` - Tenant ID
- `createdAt` - Creation date
- `updatedAt` - Last update date
- `createdBy` - Created by user ID
- `updatedBy` - Updated by user ID

### Field Aliases
- `vendorCode` → `vendor_code`
- `vendorName` → `name`
- `legalName` → `legal_name`
- `taxId` → `tax_id`
- `leadTime` → `default_lead_time_days`
- `paymentTerms` → `payment_terms`
- `taxSlabs` → `supported_tax_slabs`
- `contactPersons` → `contact_persons`
- `applicableTaxIds` → `applicable_tax_ids`
- `defaultPurchaseTaxId` → `default_purchase_tax_id`

### Custom Fields
Custom fields are automatically mapped to `custom_fields.field_name`:
- `custom_category` → `custom_fields.category`
- `custom_rating` → `custom_fields.rating`
- `custom_status` → `custom_fields.status`
- `custom_region` → `custom_fields.region`
- `custom_industry` → `custom_fields.industry`

## Examples

### 1. Find vendors by name pattern
```bash
GET /vendors?filter={"name":{"regex":"ABC.*","options":"i"}}
```

### 2. Find vendors with lead time between 5-15 days
```bash
GET /vendors?filter={"leadTime":{"gte":5,"lte":15}}
```

### 3. Find vendors supporting specific tax slabs
```bash
GET /vendors?filter={"taxSlabs":{"in":["18%","12%"]}}
```

### 4. Find vendors with custom category
```bash
GET /vendors?filter={"custom_category":"Pharmaceutical"}
```

### 5. Complex filtering with multiple conditions
```bash
GET /vendors?filter={
  "name":{"regex":"Corp.*","options":"i"},
  "leadTime":{"lte":10},
  "custom_rating":{"gte":4},
  "taxSlabs":{"in":["18%","12%"]}
}
```

### 6. Search across multiple fields
```bash
GET /vendors/search?q=ABC&page=1&limit=10
```

### 7. Get available filter fields
```bash
GET /vendors/filter-fields
```

Response:
```json
{
  "rootFields": ["vendor_code", "name", "legal_name", ...],
  "customFields": ["category", "rating", "status", ...],
  "aliases": {
    "vendorCode": "vendor_code",
    "vendorName": "name",
    ...
  }
}
```

## Pagination & Sorting

### Pagination
```bash
GET /vendors?page=2&limit=20
```

### Sorting
```bash
# Single field
GET /vendors?sort=name_asc

# Multiple fields
GET /vendors?sort=name_asc,createdAt_desc

# Using aliases
GET /vendors?sort=vendorName_asc,leadTime_desc
```

### Combined
```bash
GET /vendors?page=1&limit=10&sort=name_asc&filter={"leadTime":{"lte":15}}
```

## Error Handling

The system will return appropriate error messages for:
- Invalid field names
- Invalid operators
- Malformed filter syntax
- Unauthorized access

## Performance Considerations

1. **Indexes**: Ensure proper indexes on frequently filtered fields
2. **Custom Fields**: Custom field queries may be slower than root field queries
3. **Regex Queries**: Use regex sparingly as they can be slow
4. **Pagination**: Always use pagination for large datasets

## Migration from Old System

The new system is backward compatible. Existing queries will continue to work, but you can now use:
- Field aliases for better readability
- Advanced operators for complex queries
- Custom field filtering
- Enhanced search capabilities
