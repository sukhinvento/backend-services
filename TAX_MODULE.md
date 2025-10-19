# Tax Module Documentation

## Overview
The Tax Module provides a comprehensive system for managing tax configurations in the application. Taxes are standalone entities that can be referenced by other modules (vendors, products, invoices, etc.) using tax IDs.

## Architecture Design

### One-Way Referential Integrity
The tax module follows a **one-way referential integrity** pattern:
- **Taxes** are standalone entities with no references to vendors or products
- **Vendors and Products** can reference taxes by storing tax IDs

This design provides:
- ✅ Better normalization
- ✅ Flexibility to add/remove tax associations without modifying tax records
- ✅ Cleaner separation of concerns
- ✅ Easier tax configuration management

## Schema Structure

### Tax Schema
```typescript
{
  tax_code: string;              // Unique identifier (e.g., "GST-18")
  name: string;                  // Display name (e.g., "GST 18%")
  description?: string;          // Optional description
  rate: number;                  // Tax rate (18 for 18%)
  rate_type: 'percentage' | 'fixed';
  applicable_on: 'sales' | 'purchase' | 'both';
  status: 'active' | 'inactive' | 'archived';
  jurisdiction?: string;         // e.g., 'Federal', 'State'
  tax_category?: string;         // e.g., 'GST', 'VAT', 'Sales Tax'
  effective_from?: Date;         // When tax becomes effective
  effective_to?: Date;           // When tax expires
  components?: Array<{           // For compound taxes (e.g., CGST + SGST)
    name: string;
    rate: number;
    description?: string;
  }>;
  priority: number;              // Calculation order (lower = higher priority)
  is_inclusive: boolean;         // Whether tax is included in price
  is_compound: boolean;          // Whether calculated on subtotal + other taxes
  configuration?: {
    min_amount?: number;         // Minimum amount for tax to apply
    max_amount?: number;         // Maximum amount for tax calculation
    exempt_threshold?: number;   // Amount below which tax is exempt
    reverse_charge?: boolean;    // For reverse charge mechanism
  };
  custom_fields?: Record<string, any>;
}
```

## How to Integrate with Vendors

### Option 1: Add tax_ids array to Vendor Schema
```typescript
// In src/vendors/schemas/vendor.schema.ts
@Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Tax' }] })
default_tax_ids: string[];  // Default taxes for this vendor
```

### Option 2: Add specific tax fields
```typescript
// In src/vendors/schemas/vendor.schema.ts
@Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Tax' })
default_purchase_tax_id: string;  // Default tax for purchases from this vendor

@Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Tax' })
default_sales_tax_id: string;     // Default tax for sales to this vendor (if customer)
```

### Example Implementation
```typescript
// vendors/schemas/vendor.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Vendor extends BaseSchema {
  // ... existing fields ...
  
  // Tax references
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Tax' }] })
  applicable_tax_ids: string[];
  
  // ... rest of schema ...
}
```

## How to Integrate with Products/Inventory

### Add tax fields to Product Schema
```typescript
// In src/products/schemas/product.schema.ts (if you create one)
@Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Tax' }] })
tax_ids: string[];  // Taxes applicable to this product

@Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Tax' })
default_sales_tax_id: string;  // Default sales tax

@Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Tax' })
default_purchase_tax_id: string;  // Default purchase tax
```

## API Endpoints

### Tax Management
- `POST /taxes` - Create new tax (Admin/Manager)
- `GET /taxes` - List all taxes with pagination
- `GET /taxes/:id` - Get tax by ID
- `GET /taxes/code/:code` - Get tax by code
- `GET /taxes/by-ids?ids=id1,id2,id3` - Get multiple taxes by IDs
- `GET /taxes/active/list?applicableOn=sales` - Get all active taxes
- `PATCH /taxes/:id` - Update tax (Admin/Manager)
- `PATCH /taxes/:id/archive` - Archive tax (Admin/Manager)
- `PATCH /taxes/:id/activate` - Activate tax (Admin/Manager)
- `DELETE /taxes/:id` - Delete tax (Admin only)

### Tax Calculation
- `GET /taxes/calculate/amount?amount=1000&taxIds=id1,id2` - Calculate taxes for an amount

## Usage Examples

### 1. Create a Tax
```json
POST /taxes
{
  "tax_code": "GST-18",
  "name": "GST 18%",
  "description": "Goods and Services Tax at 18%",
  "rate": 18,
  "rate_type": "percentage",
  "applicable_on": "both",
  "status": "active",
  "tax_category": "GST",
  "jurisdiction": "India",
  "priority": 1,
  "is_inclusive": false,
  "is_compound": false
}
```

### 2. Create Compound Tax (GST = CGST + SGST)
```json
POST /taxes
{
  "tax_code": "GST-18-COMPOUND",
  "name": "GST 18% (9% CGST + 9% SGST)",
  "rate": 18,
  "rate_type": "percentage",
  "applicable_on": "both",
  "components": [
    { "name": "CGST", "rate": 9, "description": "Central GST" },
    { "name": "SGST", "rate": 9, "description": "State GST" }
  ],
  "priority": 1
}
```

### 3. Retrieve Taxes for a Vendor
```typescript
// In your vendor service/controller
const vendor = await vendorModel.findById(vendorId).exec();
const taxes = await taxService.findByIds(vendor.applicable_tax_ids);
```

### 4. Calculate Tax on an Amount
```bash
GET /taxes/calculate/amount?amount=1000&taxIds=tax1_id,tax2_id

Response:
{
  "subtotal": 1000,
  "taxes": [
    { "taxId": "tax1_id", "taxName": "GST 18%", "rate": 18, "amount": 180 }
  ],
  "total": 1180
}
```

## Integration Workflow

### For Purchase Orders
1. Select vendor
2. Fetch vendor's `applicable_tax_ids` or `default_purchase_tax_id`
3. Apply those taxes to line items or total
4. Store tax details in purchase order

### For Sales Orders
1. Select customer/products
2. Fetch product's `tax_ids` or vendor's `default_sales_tax_id`
3. Apply taxes based on jurisdiction/rules
4. Store tax breakdown in sales order

### For Invoices
1. Reference tax IDs from the source document (PO/SO)
2. Calculate final tax amounts
3. Store tax breakdown with invoice

## Tax Calculation Features

- **Priority-based calculation**: Taxes are applied in order of priority
- **Compound taxes**: Can be calculated on subtotal + previous taxes
- **Inclusive/Exclusive**: Support for tax-inclusive pricing
- **Thresholds**: Minimum amounts, exemption thresholds
- **Date-based**: Effective date ranges for tax validity
- **Components**: Support for multi-component taxes (CGST+SGST)

## Best Practices

1. **Use tax codes**: Always use meaningful tax codes (e.g., "VAT-20", "GST-18")
2. **Set effective dates**: Define when taxes become active/inactive
3. **Archive, don't delete**: Archive old taxes instead of deleting for audit trail
4. **Use components**: For compound taxes, define components for better reporting
5. **Priority matters**: Set priorities correctly for multi-tax scenarios
6. **Validate references**: Always validate tax IDs exist before associating with vendors/products

## Future Enhancements

- Tax groups (bundle multiple taxes)
- Geographic/regional tax rules
- Automatic tax calculation based on customer location
- Tax exemption certificates
- Tax reporting and analytics

