# Vendor and Tax Integration Guide

## Summary of Changes

### Issues Fixed:
1. ✅ **500 Error on Vendor Creation** - Fixed missing optional chaining for `custom_fields`
2. ✅ **CORS Issues** - Enabled CORS for cross-origin requests
3. ✅ **Tax Integration** - Added tax reference fields to vendor schema
4. ✅ **Validation** - Added proper validation pipes and made fields optional

### New Features:
- Vendors can now reference taxes by ID
- Tax autosuggest/dropdown support
- Optional fields validation
- Proper CORS configuration

---

## Vendor Schema Updates

### New Tax Fields

```typescript
// Multiple applicable taxes for this vendor
applicable_tax_ids: string[]

// Default tax for purchase transactions
default_purchase_tax_id: string
```

### Updated Fields (Now Optional)
- `legal_name` - Optional
- `address` - Optional
- `contact_persons` - Optional
- `default_lead_time_days` - Optional
- `payment_terms` - Optional
- `supported_tax_slabs` - Optional (legacy)
- `custom_fields` - Optional

### Required Fields
- `vendor_code` - Required, unique
- `name` - Required
- `tax_id` - Required (Tax identification number like GST, TIN, etc.)

---

## API Endpoints for Frontend

### 1. Create Vendor with Taxes

**Endpoint:** `POST /vendors`

**Request Body:**
```json
{
  "vendor_code": "VND-001",
  "name": "ABC Suppliers Ltd",
  "tax_id": "GST123456789",
  "address": "123 Main St, City",
  "contact_persons": ["John Doe"],
  "payment_terms": "Net 30",
  "applicable_tax_ids": [
    "670f1f77bcf86cd799439011",
    "670f1f77bcf86cd799439012"
  ],
  "default_purchase_tax_id": "670f1f77bcf86cd799439011"
}
```

**Minimal Request:**
```json
{
  "vendor_code": "VND-001",
  "name": "ABC Suppliers Ltd",
  "tax_id": "GST123456789"
}
```

### 2. Get Active Taxes for Autosuggest

**Endpoint:** `GET /taxes/active/list?applicableOn=purchase`

**Query Parameters:**
- `applicableOn` (optional): Filter by `sales`, `purchase`, or `both`

**Response:**
```json
[
  {
    "id": "670f1f77bcf86cd799439011",
    "tax_code": "GST-18",
    "name": "GST 18%",
    "description": "Goods and Services Tax at 18% rate",
    "rate": 18,
    "rate_type": "percentage",
    "applicable_on": "both",
    "status": "active",
    "jurisdiction": "India",
    "tax_category": "GST"
  },
  {
    "id": "670f1f77bcf86cd799439012",
    "tax_code": "GST-12",
    "name": "GST 12%",
    "description": "Goods and Services Tax at 12% rate",
    "rate": 12,
    "rate_type": "percentage",
    "applicable_on": "both",
    "status": "active"
  }
]
```

### 3. Get All Taxes with Pagination

**Endpoint:** `GET /taxes?page=1&limit=10&status=active`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sort` (optional): Sort field and order (e.g., `name_asc`, `rate_desc`)
- Any field can be used as filter (e.g., `status=active`, `tax_category=GST`)

### 4. Get Taxes by IDs (for displaying selected taxes)

**Endpoint:** `GET /taxes/by-ids?ids=tax1_id,tax2_id,tax3_id`

**Response:** Array of tax objects

---

## Frontend Integration Examples

### React/Next.js Example

#### 1. Fetch Active Taxes for Dropdown

```typescript
// hooks/useTaxes.ts
import { useState, useEffect } from 'react';

interface Tax {
  id: string;
  tax_code: string;
  name: string;
  rate: number;
  rate_type: 'percentage' | 'fixed';
  applicable_on: 'sales' | 'purchase' | 'both';
}

export const useActiveTaxes = (applicableOn?: 'sales' | 'purchase' | 'both') => {
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTaxes = async () => {
      try {
        const url = applicableOn 
          ? `/api/taxes/active/list?applicableOn=${applicableOn}`
          : '/api/taxes/active/list';
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (!response.ok) throw new Error('Failed to fetch taxes');
        
        const data = await response.json();
        setTaxes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTaxes();
  }, [applicableOn]);

  return { taxes, loading, error };
};
```

#### 2. Vendor Creation Form

```typescript
// components/VendorForm.tsx
import { useState } from 'react';
import { useActiveTaxes } from '../hooks/useTaxes';

export const VendorForm = () => {
  const { taxes, loading: taxesLoading } = useActiveTaxes('purchase');
  const [formData, setFormData] = useState({
    vendor_code: '',
    name: '',
    tax_id: '',
    address: '',
    contact_persons: [''],
    payment_terms: '',
    applicable_tax_ids: [] as string[],
    default_purchase_tax_id: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create vendor');
      }

      const vendor = await response.json();
      console.log('Vendor created:', vendor);
      // Handle success (redirect, show message, etc.)
    } catch (err) {
      console.error('Error creating vendor:', err);
      // Handle error (show error message)
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Basic Fields */}
      <input
        type="text"
        placeholder="Vendor Code *"
        value={formData.vendor_code}
        onChange={(e) => setFormData({ ...formData, vendor_code: e.target.value })}
        required
      />
      
      <input
        type="text"
        placeholder="Vendor Name *"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      
      <input
        type="text"
        placeholder="Tax ID (GST/TIN) *"
        value={formData.tax_id}
        onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
        required
      />

      {/* Tax Selection - Multi-select */}
      <label>Applicable Taxes</label>
      <select
        multiple
        value={formData.applicable_tax_ids}
        onChange={(e) => {
          const selected = Array.from(e.target.selectedOptions, option => option.value);
          setFormData({ ...formData, applicable_tax_ids: selected });
        }}
        disabled={taxesLoading}
      >
        {taxes.map((tax) => (
          <option key={tax.id} value={tax.id}>
            {tax.name} ({tax.rate}{tax.rate_type === 'percentage' ? '%' : ''})
          </option>
        ))}
      </select>

      {/* Default Purchase Tax - Single select */}
      <label>Default Purchase Tax</label>
      <select
        value={formData.default_purchase_tax_id}
        onChange={(e) => setFormData({ ...formData, default_purchase_tax_id: e.target.value })}
        disabled={taxesLoading}
      >
        <option value="">Select default tax...</option>
        {taxes.map((tax) => (
          <option key={tax.id} value={tax.id}>
            {tax.name} ({tax.rate}{tax.rate_type === 'percentage' ? '%' : ''})
          </option>
        ))}
      </select>

      <button type="submit">Create Vendor</button>
    </form>
  );
};
```

#### 3. Using React-Select for Better Autosuggest

```typescript
import Select from 'react-select';

// In your component
const taxOptions = taxes.map(tax => ({
  value: tax.id,
  label: `${tax.name} (${tax.rate}${tax.rate_type === 'percentage' ? '%' : ''})`,
  data: tax
}));

<Select
  isMulti
  options={taxOptions}
  value={taxOptions.filter(opt => formData.applicable_tax_ids.includes(opt.value))}
  onChange={(selected) => {
    setFormData({
      ...formData,
      applicable_tax_ids: selected.map(s => s.value)
    });
  }}
  placeholder="Select applicable taxes..."
  isLoading={taxesLoading}
/>
```

### Vue.js Example

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <!-- Basic fields -->
    <input v-model="formData.vendor_code" placeholder="Vendor Code *" required />
    <input v-model="formData.name" placeholder="Vendor Name *" required />
    <input v-model="formData.tax_id" placeholder="Tax ID *" required />
    
    <!-- Tax multi-select -->
    <label>Applicable Taxes</label>
    <select v-model="formData.applicable_tax_ids" multiple>
      <option v-for="tax in taxes" :key="tax.id" :value="tax.id">
        {{ tax.name }} ({{ tax.rate }}{{ tax.rate_type === 'percentage' ? '%' : '' }})
      </option>
    </select>
    
    <button type="submit">Create Vendor</button>
  </form>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const taxes = ref([]);
const formData = ref({
  vendor_code: '',
  name: '',
  tax_id: '',
  applicable_tax_ids: [],
  default_purchase_tax_id: ''
});

onMounted(async () => {
  const response = await fetch('/api/taxes/active/list?applicableOn=purchase');
  taxes.value = await response.json();
});

const handleSubmit = async () => {
  const response = await fetch('/api/vendors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(formData.value),
  });
  // Handle response
};
</script>
```

---

## CORS Configuration

CORS is now enabled with the following default origins:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:4200`
- `http://localhost:5173`
- `http://localhost:8080`

### To Add Custom Origins

Set the `CORS_ORIGIN` environment variable:

```bash
# .env
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
```

---

## Testing with Swagger UI

1. Navigate to `http://localhost:3000/api`
2. Authorize with your JWT token
3. Test the endpoints:
   - `GET /taxes/active/list` - Get all active taxes
   - `POST /vendors` - Create a vendor with tax references
   - `GET /vendors/:id` - View vendor with tax IDs

---

## Seeding Sample Taxes

To seed sample tax data:

```bash
# Seed only taxes
npm run seed taxes

# Seed everything (roles, users, and taxes)
npm run seed all

# List all taxes
npm run seed list-taxes
```

This will create:
- GST taxes: 5%, 12%, 18%, 28% (India)
- VAT taxes: 0%, 5%, 20% (UK)
- Sales taxes: 7%, 10% (USA)
- Compound taxes (CGST + SGST)
- Service tax, Environmental tax, Luxury tax

---

## Error Handling

### Common Errors and Solutions

**500 Error on Vendor Creation:**
- ✅ Fixed: `custom_fields` is now optional
- Solution: Can be omitted or set to `{}`

**CORS Error:**
- ✅ Fixed: CORS is now enabled
- If still seeing errors, add your origin to `CORS_ORIGIN` env variable

**Validation Errors:**
- Required fields: `vendor_code`, `name`, `tax_id`
- Tax IDs must be valid MongoDB ObjectIds
- All other fields are optional

---

## Next Steps

1. **Restart your backend** to apply changes
2. **Seed taxes** using `npm run seed taxes`
3. **Update frontend** to use the new tax fields
4. **Test vendor creation** with tax selection
5. **Verify CORS** is working from your frontend

## Example: Complete Vendor Creation Flow

```typescript
// 1. Fetch active taxes on component mount
const { taxes } = useActiveTaxes('purchase');

// 2. User selects taxes from dropdown
// 3. Submit form with tax IDs

const vendorData = {
  vendor_code: "VND-001",
  name: "ABC Suppliers",
  tax_id: "GST123456",
  applicable_tax_ids: ["tax_id_1", "tax_id_2"],
  default_purchase_tax_id: "tax_id_1"
};

// 4. POST to /vendors
const response = await fetch('/api/vendors', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN',
  },
  body: JSON.stringify(vendorData)
});

// 5. Success! Vendor created with tax references
```

