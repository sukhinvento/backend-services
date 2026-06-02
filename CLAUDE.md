# Backend Services - AI Assistant Context

## Project Overview

**MedSystem Backend** - NestJS-based healthcare management API supporting multi-tenant operations with dynamic schema configuration, RBAC, event-driven invoicing, and Kafka-powered event streaming.

**Status**: Production-ready with active feature development
**Last Updated**: 2026-05-24

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | Node.js | 18+ |
| **Framework** | NestJS | 10+ |
| **Language** | TypeScript | 5+ |
| **Database** | MongoDB | 7.0 |
| **Event Stream** | Kafka | 7.6.0 |
| **Authentication** | JWT | Custom implementation |
| **Validation** | class-validator | Latest |
| **ORM** | Mongoose | Latest |

---

## Project Structure

Every business module follows the same structure as the tenant module. Below is the actual file listing from the codebase.

```
backend-services/
├── src/
│   ├── app.module.ts                    [Root module, imports all features]
│   ├── main.ts                          [Bootstrap, global pipes, CORS config]
│   │
│   ├── ──── INFRASTRUCTURE MODULES ────
│   │
│   ├── auth/                            [JWT authentication & user management]
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── jwt-auth.guard.ts
│   │   ├── jwt.strategy.ts
│   │   ├── roles.guard.ts
│   │   ├── scopes.guard.ts
│   │   ├── roles.decorator.ts
│   │   ├── scopes.decorator.ts
│   │   ├── schemas/
│   │   │   ├── user.schema.ts           [username, password_hash, roles[], tenantId]
│   │   │   └── role.schema.ts
│   │   ├── enums/
│   │   │   ├── roles.enum.ts
│   │   │   └── scopes.enum.ts
│   │   ├── permissions/
│   │   │   └── permissions.matrix.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       ├── create-user.dto.ts
│   │       ├── update-user.dto.ts
│   │       ├── create-role.dto.ts
│   │       ├── update-role.dto.ts
│   │       └── auth-response.dto.ts
│   │
│   ├── common/                          [Shared utilities]
│   │   ├── decorators/                  [@Scopes, @Roles, @TenantId]
│   │   ├── guards/                      [RolesGuard, ScopesGuard]
│   │   ├── schemas/
│   │   │   └── base.schema.ts           [BaseSchema: id, createdBy, updatedBy]
│   │   ├── enums/
│   │   │   ├── roles.enum.ts
│   │   │   └── scopes.enum.ts
│   │   ├── dto/
│   │   │   └── query.dto.ts             [QueryDto: page, limit, sort, filter]
│   │   ├── interfaces/
│   │   │   └── request-with-user.interface.ts [userId, username, roles, scopes, tenantId]
│   │   ├── services/
│   │   │   └── query-builder.service.ts [Dynamic filtering & pagination]
│   │   └── filters/
│   │       └── all-exceptions.filter.ts [Global error handling]
│   │
│   ├── kafka/                           [Event streaming system]
│   │   ├── kafka.module.ts
│   │   ├── kafka.service.ts             [Producer/consumer setup]
│   │   ├── event-handler.base.ts        [Base class for handlers]
│   │   └── listeners/                   [Event consumer configs]
│   │
│   ├── audit/                           [Audit logging]
│   │   ├── audit.module.ts
│   │   ├── audit.service.ts
│   │   ├── schemas/
│   │   │   └── audit-log.schema.ts
│   │   └── dto/
│   │       └── create-audit-log.dto.ts
│   │
│   ├── config/                          [App configuration]
│   ├── database/                        [MongoDB connection setup]
│   ├── logger/                          [Logging setup]
│   │
│   ├── ──── TENANT MANAGEMENT ────
│   │
│   ├── tenants/                         [Multi-tenant management + dynamic schema config]
│   │   ├── tenants.controller.ts
│   │   ├── tenants.service.ts
│   │   ├── tenants.module.ts
│   │   ├── schemas/
│   │   │   ├── tenant.schema.ts         [name, tenantId, fieldConfigurations Map]
│   │   │   └── field-configuration.schema.ts [field_id, label, type, values?, required]
│   │   └── dto/
│   │       ├── create-tenant.dto.ts
│   │       └── create-field-configuration.dto.ts
│   │
│   ├── ──── BUSINESS MODULES (all follow tenant pattern) ────
│   │
│   ├── vendors/                         [Supplier management — REFERENCE IMPLEMENTATION]
│   │   ├── vendors.controller.ts
│   │   ├── vendors.service.ts
│   │   ├── vendors.module.ts
│   │   ├── schemas/
│   │   │   └── vendor.schema.ts         [vendor_code, name, tax_id, custom_fields, tenantId]
│   │   ├── services/
│   │   │   └── vendor-query.service.ts  [Vendor-specific query logic]
│   │   └── dto/
│   │       ├── create-vendor.dto.ts
│   │       ├── update-vendor.dto.ts
│   │       └── vendor-response.dto.ts
│   │
│   ├── purchase-orders/                 [Order from suppliers]
│   │   ├── purchase-orders.controller.ts
│   │   ├── purchase-orders.service.ts
│   │   ├── purchase-orders.service.spec.ts
│   │   ├── purchase-orders.module.ts
│   │   ├── schemas/
│   │   │   └── purchase-order.schema.ts [po_number, vendor_id/name, items[], custom_fields, tenantId]
│   │   └── dto/
│   │       ├── create-purchase-order.dto.ts
│   │       └── update-purchase-order.dto.ts
│   │
│   ├── sales-orders/                    [Sell to customers]
│   │   ├── sales-orders.controller.ts
│   │   ├── sales-orders.service.ts
│   │   ├── sales-orders.service.spec.ts
│   │   ├── sales-orders.module.ts
│   │   ├── schemas/
│   │   │   └── sales-order.schema.ts    [so_number, customer_id/name, items[], custom_fields, tenantId]
│   │   └── dto/
│   │       ├── create-sales-order.dto.ts
│   │       └── update-sales-order.dto.ts
│   │
│   ├── inventory/                       [Stock management]
│   │   ├── inventory.controller.ts
│   │   ├── inventory.service.ts
│   │   ├── inventory.module.ts
│   │   ├── schemas/
│   │   │   └── inventory-item.schema.ts [sku, name, supplier_id FK→Vendor, custom_fields, tenantId]
│   │   └── dto/
│   │       ├── create-inventory-item.dto.ts
│   │       ├── update-inventory-item.dto.ts
│   │       └── adjust-stock.dto.ts
│   │
│   ├── doctors/                         [Medical staff]
│   │   ├── doctors.controller.ts
│   │   ├── doctors.service.ts
│   │   ├── doctors.module.ts
│   │   ├── schemas/
│   │   │   └── doctor.schema.ts         [employee_id, name, department, custom_fields, tenantId]
│   │   └── dto/
│   │       ├── create-doctor.dto.ts
│   │       └── update-doctor.dto.ts
│   │
│   ├── patients/                        [Patient records]
│   │   ├── patients.controller.ts
│   │   ├── patients.service.ts
│   │   ├── patients.module.ts
│   │   ├── schemas/
│   │   │   └── patient.schema.ts        [patient_id, first/last_name, assigned_doctor_id FK→Doctor, custom_fields, tenantId]
│   │   └── dto/
│   │       ├── create-patient.dto.ts
│   │       ├── update-patient.dto.ts
│   │       └── patient-response.dto.ts
│   │
│   ├── admissions/                      [Patient admissions & discharge]
│   │   ├── admissions.controller.ts
│   │   ├── admissions.service.ts        [Discharge emits Kafka event]
│   │   ├── admissions.module.ts
│   │   ├── schemas/
│   │   │   └── admission.schema.ts      [admission_number, patient_id FK→Patient, room_id FK→Room, doctor_id FK→Doctor, custom_fields, tenantId]
│   │   └── dto/
│   │       ├── create-admission.dto.ts
│   │       └── update-admission.dto.ts
│   │
│   ├── diagnostics/                     [Lab tests: catalog + bookings]
│   │   ├── diagnostics.controller.ts
│   │   ├── diagnostics.service.ts       [Test completion emits Kafka event]
│   │   ├── diagnostics.module.ts
│   │   ├── schemas/
│   │   │   ├── diagnostic-test.schema.ts      [test_code, name, category, price — catalog, NO custom_fields]
│   │   │   └── patient-diagnostic.schema.ts   [booking_number, patient_id FK→Patient, test_id FK→DiagnosticTest, ordered_by_doctor_id FK→Doctor — NO custom_fields]
│   │   └── dto/
│   │       ├── create-diagnostic-test.dto.ts
│   │       ├── update-diagnostic-test.dto.ts
│   │       ├── create-patient-diagnostic.dto.ts
│   │       └── update-patient-diagnostic.dto.ts
│   │
│   ├── rooms/                           [Hospital room management]
│   │   ├── rooms.controller.ts
│   │   ├── rooms.service.ts
│   │   ├── rooms.module.ts
│   │   ├── schemas/
│   │   │   └── room.schema.ts           [room_number, type, status, daily_rate, custom_fields, tenantId]
│   │   └── dto/
│   │       ├── create-room.dto.ts
│   │       └── update-room.dto.ts
│   │
│   ├── medications/                     [Drug catalog + patient prescriptions]
│   │   ├── medications.controller.ts
│   │   ├── medications.service.ts
│   │   ├── medications.module.ts
│   │   ├── schemas/
│   │   │   ├── medication.schema.ts         [drug_code, name, dosage_form, price — NO custom_fields]
│   │   │   └── patient-medication.schema.ts [patient prescriptions]
│   │   └── dto/
│   │       ├── create-medication.dto.ts
│   │       ├── update-medication.dto.ts
│   │       ├── create-patient-medication.dto.ts
│   │       └── update-patient-medication.dto.ts
│   │
│   ├── invoices/                        [B2B invoices from PO/SO]
│   │   ├── invoices.controller.ts
│   │   ├── invoices.service.ts
│   │   ├── invoices.event-handler.ts    [Kafka consumer — auto-creates on PO/SO]
│   │   ├── invoices.module.ts
│   │   ├── schemas/
│   │   │   └── invoice.schema.ts        [invoice_number, order_id, amount, status, custom_fields, tenantId]
│   │   └── dto/
│   │       ├── create-invoice.dto.ts
│   │       └── update-invoice.dto.ts
│   │
│   ├── hospital-billing/                [Patient bills from admission/diagnostics]
│   │   ├── hospital-billing.controller.ts
│   │   ├── hospital-billing.service.ts
│   │   ├── hospital-billing.event-handler.ts [Kafka consumer — auto-creates on discharge/diagnostic]
│   │   ├── hospital-billing.module.ts
│   │   ├── schemas/
│   │   │   └── hospital-bill.schema.ts  [invoice_number, patient_id FK→Patient, admission_id FK→Admission, line_items[], NO custom_fields]
│   │   └── dto/
│   │       ├── create-hospital-bill.dto.ts
│   │       ├── update-hospital-bill.dto.ts
│   │       └── record-payment.dto.ts
│   │
│   ├── fulfillments/                    [PO goods receipt]
│   │   ├── fulfillments.controller.ts
│   │   ├── fulfillments.service.ts
│   │   ├── fulfillments.module.ts
│   │   ├── schemas/
│   │   │   └── fulfillment.schema.ts    [fulfillment_number, po_id, items[], custom_fields — MISSING tenantId]
│   │   └── dto/
│   │       ├── create-fulfillment.dto.ts
│   │       ├── update-fulfillment.dto.ts
│   │       └── fulfillment-response.dto.ts
│   │
│   ├── quotations/                      [Vendor/customer quotations]
│   │   ├── quotations.controller.ts
│   │   ├── quotations.service.ts
│   │   ├── quotations.module.ts
│   │   ├── schemas/
│   │   │   └── quotation.schema.ts      [quotation_number, vendor_id, customer_id, items[], custom_fields — MISSING tenantId]
│   │   └── dto/
│   │       ├── create-quotation.dto.ts
│   │       ├── update-quotation.dto.ts
│   │       └── quotation-response.dto.ts
│   │
│   ├── stock/                           [Stock adjustments & transfers]
│   │   ├── stock.controller.ts
│   │   ├── stock.service.ts
│   │   ├── stock.module.ts
│   │   ├── schemas/
│   │   │   ├── stock-adjustment.schema.ts   [adjustment_number, items[], custom_fields, tenantId]
│   │   │   └── stock-transfer.schema.ts     [transfer_number, from/to locations, items[], custom_fields, tenantId]
│   │   └── dto/
│   │       ├── create-stock-adjustment.dto.ts
│   │       ├── update-stock-adjustment.dto.ts
│   │       ├── create-stock-transfer.dto.ts
│   │       └── update-stock-transfer.dto.ts
│   │
│   ├── tax/                             [Tax configuration — GLOBAL, no tenantId]
│   │   ├── tax.controller.ts
│   │   ├── tax.service.ts
│   │   ├── tax.module.ts
│   │   ├── schemas/
│   │   │   └── tax.schema.ts            [tax_code, name, rate, rate_type, components[], custom_fields]
│   │   └── dto/
│   │       ├── create-tax.dto.ts
│   │       ├── update-tax.dto.ts
│   │       └── tax-response.dto.ts
│   │
│   └── scripts/                         [Utility scripts]
│
├── schema-configs/                      [JSON schema definitions for fieldConfigurations]
│   ├── vendors.json
│   ├── purchase-orders.json
│   ├── sales-orders.json
│   ├── inventory.json
│   ├── doctors.json
│   ├── patients.json
│   ├── diagnostics.json
│   └── hospital-billing.json
│
├── scripts/
│   ├── seed-standalone.ts               [Seed all data]
│   ├── seed-inventory-from-medications.ts
│   ├── seed-po-so-orders.ts
│   ├── setup-schemas.sh                 [Configure field schemas for tenant]
│   └── [other utility scripts]
│
├── Dockerfile
├── docker-compose.yml                   [MongoDB, Kafka, Zookeeper, Backend, Frontend]
├── package.json
├── tsconfig.json
└── CLAUDE.md                            [This file]
```

---

## Key Architectural Patterns

### 1. **Module Architecture**
Each business module follows:
```
module.ts → Imports all dependencies
controller.ts → HTTP endpoints, request validation
service.ts → Business logic, database operations
*.schema.ts → Mongoose schema definitions
dto/ → Input validation & documentation
```

### 2. **Dynamic Schema Configuration (Core Architecture)**

This is the most important pattern in the system. Every business module uses a **hybrid schema**: a small set of fixed Mongoose fields + a flexible `custom_fields` bag. The tenant's `fieldConfigurations` map defines what goes into `custom_fields` per module, making the schema fully dynamic and customisable per client.

```
Tenant
└─ fieldConfigurations: Map<module_key, FieldConfiguration[]>
   ├─ "vendor"           → [{field_id, label, type, values?, required}, ...]
   ├─ "purchase_order"   → [{...}, ...]
   ├─ "sales_order"      → [{...}, ...]
   ├─ "inventory"        → [{...}, ...]
   ├─ "doctor"           → [{...}, ...]
   ├─ "patient"          → [{...}, ...]
   ├─ "diagnostic"       → [{...}, ...]
   └─ "hospital_billing" → [{...}, ...]

FieldConfiguration schema:
  field_id: string       → e.g. "vendor_category", "status", "email"
  label: string          → e.g. "Vendor Category" (shown in UI)
  type: enum             → "string" | "enum" | "boolean" | "date"
  values?: string[]      → e.g. ["Pharmaceutical","Medical Devices"] (only for type=enum)
  required: boolean      → true = service rejects create if missing
```

**How it works end-to-end:**

```
1. Admin calls: POST /tenants/:tenantId/config/vendor/fields
   Body: { "fields": [ {field_id:"category", label:"Category", type:"enum", values:["Pharma","Devices"], required:true}, ... ] }

2. TenantsService stores: tenant.fieldConfigurations.set("vendor", fields)

3. User calls: POST /vendors  with body { vendor_code:"V001", name:"Corp", custom_fields:{ category:"Pharma", email:"x@y.com" } }

4. VendorsService.create():
   a) Fetches fieldConfigs = tenantsService.getFieldConfiguration(tenantId, "vendor")
   b) For each fieldConfig where required=true, checks dto.custom_fields[field_id] exists
   c) Throws BadRequestException if required field missing
   d) Saves record with custom_fields as-is into MongoDB Mixed type

5. QueryBuilderService:
   - Filters on schema root fields directly (name, vendor_code, tenantId)
   - Filters on custom_fields transparently: filter.category → custom_fields.category
```

**Every new module MUST follow this pattern** — see "Module Implementation Pattern" section below.

### 3. **Event-Driven Architecture (Kafka)**
```
Service creates record
  ↓
Emits Kafka event
  ↓
EventHandler (consumer) listens
  ↓
Creates related records (e.g., Invoice)
  ↓
(Async, decoupled, no blocking)
```

### 4. **RBAC (Role-Based Access Control)**
```
User → Roles → Scopes → Module Access

Example:
Doctor role has scopes: [patients, admissions, diagnostics, medications]
Admin role has scopes: [all modules]

Guards enforce:
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Scopes(Scope.VENDORS)
```

### 5. **Multi-Tenancy**
```
Every record has tenantId
Every query filters by tenantId
Tenant isolation is complete
Different tenants can customize schemas
```

---

## Critical Files & Their Purposes

### Core Files
- **app.module.ts** - Registers all modules, sets up global features
- **main.ts** - Bootstraps app, configures ValidationPipe, CORS, Swagger
- **common/filters/all-exceptions.filter.ts** - Global error handling

### Authentication & Authorization
- **auth/jwt-auth.guard.ts** - Validates JWT token
- **common/guards/roles.guard.ts** - Checks user roles
- **common/guards/scopes.guard.ts** - Checks module access (critical!)

### Database & Schemas
- **common/schemas/base.schema.ts** - Parent class for all entities (id, createdBy, updatedBy)
- **tenants/schemas/field-configuration.schema.ts** - Dynamic field definitions

### Event System
- **kafka/kafka.service.ts** - Producer & consumer setup
- **[module]/[module].event-handler.ts** - Kafka consumers (e.g., invoices.event-handler.ts)

### Key Services
- **tenants/tenants.service.ts** - Tenant management & schema configuration
- **common/services/query-builder.service.ts** - Handles filtering, pagination, sorting

---

## Module Implementation Pattern (How Every Module Works)

Every business module follows the **same hybrid schema pattern** established by the Vendor module. Understanding this pattern is critical — it's the foundation of the entire system.

### The Two-Layer Schema

Each module has **fixed root fields** (structural, always present) + **custom_fields** (dynamic, tenant-configurable):

```typescript
// ACTUAL vendor.schema.ts (reference implementation)
@Schema({ timestamps: true })
export class Vendor extends BaseSchema {
  // ─── FIXED ROOT FIELDS (structural, always in Mongoose schema) ───
  @Prop({ required: true, unique: true })
  vendor_code: string;                    // Business identifier

  @Prop({ required: true })
  name: string;                           // Core display field

  @Prop({ required: true })
  tax_id: string;                         // PII — encrypted at rest

  @Prop()
  legal_name: string;

  @Prop()
  address: string;                        // PII — encrypted at rest

  @Prop([String])
  contact_persons: string[];              // PII — encrypted at rest

  @Prop()
  default_lead_time_days: number;

  @Prop()
  payment_terms: string;

  @Prop([String])
  supported_tax_slabs: string[];

  // Referential integrity to Tax module
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Tax' }] })
  applicable_tax_ids: string[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Tax' })
  default_purchase_tax_id: string;

  // ─── DYNAMIC FIELDS (tenant-configurable via fieldConfigurations) ───
  @Prop({ type: MongooseSchema.Types.Mixed })
  custom_fields: Record<string, any>;
  // Examples of what tenants put here:
  //   category: "Pharmaceutical"      (type: enum)
  //   status: "Active"                (type: enum)
  //   email: "vendor@corp.com"        (type: string)
  //   phone: "9876543210"             (type: string)
  //   city: "Mumbai"                  (type: string)
  //   state: "Maharashtra"            (type: string)
  //   gst_number: "29AAACR..."        (type: string)
  //   payment_methods: ["UPI","NEFT"] (type: enum, multi-select)
  //   creditLimit: 500000             (type: string/number)
  //   risk_level: "Low"               (type: enum)

  // ─── MULTI-TENANCY ───
  @Prop({ required: true })
  tenantId: string;
}
```

### What Goes in Root Fields vs custom_fields

| Root fields (Mongoose schema) | custom_fields (tenant config) |
|-------------------------------|-------------------------------|
| Business identifiers (vendor_code, po_number) | Display/UI fields (category, status, email, phone) |
| Foreign keys (vendor_id, applicable_tax_ids) | Enum dropdowns (status, category, risk_level) |
| Structural arrays (items[], remarks[]) | Contact details (email, phone, city, state) |
| Calculated values (grand_total, paid_amount) | Regulatory fields (gst_number, pan_number) |
| System fields (tenantId, status for workflow) | Any field the tenant can customise |

### The Service Pattern (Vendor as Reference)

```typescript
// ACTUAL vendors.service.ts — create() method
async create(createVendorDto: CreateVendorDto, userId: string, tenantId: string) {

  // STEP 1: Validate custom_fields against tenant's field configuration
  try {
    const fieldConfigs = await this.tenantsService.getFieldConfiguration(
      tenantId,
      'vendor',    // ← module key matches fieldConfigurations map key
    );

    if (fieldConfigs && Array.isArray(fieldConfigs)) {
      for (const fieldConfig of fieldConfigs) {
        if (
          fieldConfig.required &&
          !createVendorDto.custom_fields?.[fieldConfig.field_id]
        ) {
          throw new BadRequestException(`${fieldConfig.label} is required.`);
        }
      }
    }
  } catch (error) {
    // If tenant config doesn't exist, continue without custom field validation
    console.warn('Tenant configuration not found, skipping custom field validation');
  }

  // STEP 2: Validate referential integrity (tax IDs)
  if (createVendorDto.applicable_tax_ids?.length > 0) {
    const validTaxes = await this.taxService.findByIds(createVendorDto.applicable_tax_ids);
    if (validTaxes.length !== createVendorDto.applicable_tax_ids.length) {
      throw new BadRequestException('One or more tax IDs are invalid or inactive.');
    }
  }

  // STEP 3: Check uniqueness within tenant
  const existingVendor = await this.vendorModel.findOne({
    vendor_code: createVendorDto.vendor_code,
    tenantId,
  }).exec();
  if (existingVendor) {
    throw new BadRequestException(`Vendor with code ${createVendorDto.vendor_code} already exists.`);
  }

  // STEP 4: Save with tenantId and audit fields
  const newVendor = new this.vendorModel({
    ...createVendorDto,
    tenantId,
    createdBy: userId,
    updatedBy: userId,
  });
  const savedVendor = await newVendor.save();

  // STEP 5: Audit log
  void this.auditService.log({
    userId, action: 'create', entity: 'vendor',
    entityId: savedVendor.id, newValue: savedVendor.toObject(), tenantId,
  });

  return savedVendor;
}
```

### The DTO Pattern

```typescript
// ACTUAL create-vendor.dto.ts — fixed fields validated by class-validator,
// custom_fields is an open bag (validated by service against tenant config)
export class CreateVendorDto {
  @IsString()
  vendor_code: string;

  @IsString()
  name: string;

  @IsString()
  tax_id: string;

  @IsOptional() @IsString()
  legal_name?: string;

  @IsOptional() @IsString()
  address?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  contact_persons?: string[];

  @IsOptional() @IsNumber() @Min(0)
  default_lead_time_days?: number;

  @IsOptional() @IsString()
  payment_terms?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  applicable_tax_ids?: string[];

  @IsOptional() @IsString()
  default_purchase_tax_id?: string;

  @IsOptional()
  custom_fields?: Record<string, any>;   // ← dynamic, validated by service
}
```

### The Query Pattern

```typescript
// ACTUAL query-builder.service.ts — transparently routes filters
// to root fields or custom_fields based on Mongoose schema paths
buildQuery(model: Model<T>, queryDto: QueryDto) {
  const { page = 1, limit = 10, sort, filter } = queryDto;
  const query = model.find();

  if (filter) {
    const schemaPaths = Object.keys(model.schema.paths);
    const transformedFilter: Record<string, any> = {};
    for (const key in filter) {
      if (schemaPaths.includes(key)) {
        transformedFilter[key] = filter[key];         // Root field
      } else {
        transformedFilter[`custom_fields.${key}`] = filter[key];  // → custom_fields
      }
    }
    query.where(transformedFilter);
  }

  if (sort) {
    const [field, order] = sort.split('_');
    query.sort({ [field]: order === 'desc' ? -1 : 1 });
  }

  query.skip((page - 1) * limit).limit(limit);
  return query;
}
```

---

## How Each Module Must Follow This Pattern

Every module listed below MUST use the same architecture. The table shows what goes in root fields vs what the tenant configures in `custom_fields` via `POST /tenants/:id/config/:module_key/fields`.

### Module Key Mapping (for fieldConfigurations)

| Module | module_key | Collection | Unique ID field | Referential FKs | Has custom_fields |
|--------|-----------|------------|-----------------|-----------------|-------------------|
| Vendors | `vendor` | vendors | vendor_code | applicable_tax_ids → Tax, default_purchase_tax_id → Tax | Yes |
| Purchase Orders | `purchase_order` | purchaseorders | po_number | vendor_id (denormalized) | Yes |
| Sales Orders | `sales_order` | salesorders | so_number | — (customer denormalized) | Yes |
| Inventory | `inventory` | inventoryitems | sku | supplier_id → Vendor, applicable_tax_ids → Tax | Yes |
| Doctors | `doctor` | doctors | employee_id | — | Yes |
| Patients | `patient` | patients | patient_id | assigned_doctor_id → Doctor | Yes |
| Diagnostics (Catalog) | `diagnostic_test` | diagnostictests | test_code | — | No |
| Diagnostics (Booking) | `patient_diagnostic` | patientdiagnostics | booking_number | patient_id → Patient, test_id → DiagnosticTest, ordered_by_doctor_id → Doctor, technician_id → Doctor | No |
| Hospital Billing | `hospital_billing` | hospitalbills | invoice_number | patient_id → Patient, admission_id → Admission, line_items.tax_ids → Tax | No |
| Admissions | `admission` | admissions | admission_number | patient_id → Patient, room_id → Room, doctor_id → Doctor | Yes |
| Invoices | `invoice` | invoices | invoice_number | order_id (denormalized) | Yes |
| Rooms | `room` | rooms | room_number | — | Yes |
| Medications | `medication` | medications | drug_code | — | No |
| Fulfillments | `fulfillment` | fulfillments | fulfillment_number | po_id (denormalized) | Yes |
| Quotations | `quotation` | quotations | quotation_number | vendor_id, customer_id (denormalized) | Yes |
| Stock Adjustments | `stock_adjustment` | stockadjustments | adjustment_number | — | Yes |
| Stock Transfers | `stock_transfer` | stocktransfers | transfer_number | — | Yes |
| Tax | — (global) | taxes | tax_code | — | Yes |
| Users | — (system) | users | username | — | No |

**Note**: Modules marked "No" for custom_fields either have all fields defined in root schema or haven't been updated to include the custom_fields bag yet. Tax is global (no tenantId). Users is a system module under auth/.

### Per-Module Schema Breakdown (From Actual Source Code)

#### VENDORS (Reference implementation — vendor.schema.ts)
```
Root fields:        vendor_code (required, unique per tenant), name (required),
                    tax_id (required, @PII), legal_name, address (@PII),
                    contact_persons[] (@PII), default_lead_time_days,
                    payment_terms, supported_tax_slabs[],
                    applicable_tax_ids[] (FK → Tax), default_purchase_tax_id (FK → Tax),
                    tenantId (required, indexed)
custom_fields:      Record<string, any> (Mixed) — tenant-configured via fieldConfigurations
module_key:         "vendor"
```

#### PURCHASE ORDERS (purchase-order.schema.ts)
```
Root fields:        po_number (required, unique per tenant), vendor_id, vendor_name,
                    vendor_phone, vendor_email, vendor_address, shipping_address,
                    order_date, delivery_date, fulfilment_date,
                    items[] (Mixed array), grand_total (default 0), paid_amount (default 0),
                    payment_method, notes, approved_by, remarks[] (Mixed array),
                    status (default 'draft'), tenantId (required, indexed)
custom_fields:      Record<string, any> (Mixed)
module_key:         "purchase_order"
```

#### SALES ORDERS (sales-order.schema.ts)
```
Root fields:        so_number (required, unique per tenant), customer_id, customer_name,
                    customer_email, customer_phone, customer_address,
                    shipping_address, billing_address,
                    order_date, due_date, delivery_date,
                    items[] (Mixed array), grand_total (default 0), paid_amount (default 0),
                    payment_method, payment_status (default 'Pending'),
                    status (default 'draft'), notes,
                    tenantId (required, indexed)
custom_fields:      Record<string, any> (Mixed)
module_key:         "sales_order"
```

#### INVENTORY (inventory-item.schema.ts)
```
Root fields:        sku (required, unique per tenant), name (required),
                    category, description, unit_of_measure, sale_unit,
                    unit_price, current_stock (default 0),
                    min_stock_level (default 0), max_stock_level (default 0),
                    reorder_quantity, supplier (string), supplier_id (FK → Vendor),
                    manufacturer, location, batch_number, expiry_date,
                    barcode, rfid_tag, applicable_tax_ids[] (FK → Tax),
                    is_active (default true), tenantId (required, indexed)
custom_fields:      Record<string, any> (Mixed)
module_key:         "inventory"
```

#### DOCTORS (doctor.schema.ts)
```
Root fields:        employee_id (required, unique per tenant), name (required, @PII),
                    gender, dob (@PII), phone (@PII), phone_search_hash,
                    email (@PII), email_search_hash,
                    department (required), specialisation, qualification[] (array),
                    experience_years, status (enum: active|on_leave|inactive, default active),
                    schedule[] ({day, start_time, end_time}), consultation_fee,
                    opd_slots_per_day, active_patient_count (default 0),
                    join_date, registration_no (@PII), bio, languages[],
                    tenantId (required, indexed)
custom_fields:      Record<string, any> (Mixed)
module_key:         "doctor"
```

#### PATIENTS (patient.schema.ts)
```
Root fields:        patient_id (required, unique per tenant, auto-gen PAT-XXXX),
                    first_name (required, @PII), last_name (required, @PII),
                    gender, dob (@PII), phone (@PII), phone_search_hash,
                    email (@PII), email_search_hash, address (@PII),
                    blood_group, emergency_contact_name (@PII),
                    emergency_contact_phone (@PII), allergies[], existing_conditions[],
                    barcode, rfid_tag,
                    status (enum: active|admitted|discharged|deceased, default active),
                    department, assigned_doctor_id (FK → Doctor),
                    tenantId (required, indexed)
custom_fields:      Record<string, any> (Mixed)
module_key:         "patient"
```

#### DIAGNOSTIC TESTS — Catalog (diagnostic-test.schema.ts)
```
Root fields:        test_code (required, unique per tenant), name (required),
                    category, price, duration_minutes,
                    preparation_instructions, department, description,
                    is_active (default true), tenantId (required, indexed)
custom_fields:      NONE — catalog entity, not tenant-configurable
module_key:         "diagnostic_test"
```

#### PATIENT DIAGNOSTICS — Bookings (patient-diagnostic.schema.ts)
```
Root fields:        booking_number (required, unique per tenant, auto-gen DIAG-XXXX),
                    patient_id (FK → Patient, required), test_id (FK → DiagnosticTest, required),
                    ordered_by_doctor_id (FK → Doctor), ordered_date (Date, default now),
                    scheduled_date (Date), scheduled_time,
                    completed_date (Date),
                    status (enum: ordered|pending|scheduled|in_progress|completed|cancelled, default pending),
                    priority (enum: routine|urgent|emergency|stat, default routine),
                    price, results, result_file_url, notes,
                    technician_id (FK → Doctor), tenantId (required, indexed)
custom_fields:      NONE
module_key:         "patient_diagnostic"
```

#### HOSPITAL BILLING (hospital-bill.schema.ts)
```
Root fields:        invoice_number (required, unique per tenant, auto-gen HINV-XXXX),
                    patient_id (FK → Patient, required), admission_id (FK → Admission),
                    line_items[] ({description, category (enum: room_charges|procedure|medication|
                      diagnostic|consultation|other), quantity, unit_price, discount_percent,
                      tax_ids[] (FK → Tax), subtotal, tax_amount, total}),
                    subtotal (default 0), total_tax (default 0), total_discount (default 0),
                    grand_total (default 0), status (enum: draft|issued|partially_paid|paid|
                      cancelled|overdue, default draft),
                    payment_mode, paid_amount (default 0),
                    due_date (Date), issued_date (Date), notes,
                    tenantId (required, indexed)
custom_fields:      NONE
module_key:         "hospital_billing"
```

#### ADMISSIONS (admission.schema.ts)
```
Root fields:        admission_number (required, unique per tenant, auto-gen ADM-XXXX),
                    patient_id (FK → Patient, required), room_id (FK → Room, required),
                    doctor_id (FK → Doctor, required),
                    admission_date (Date, default now), expected_discharge_date (Date),
                    actual_discharge_date (Date),
                    admission_type (required, enum: planned|emergency|transfer|day_care),
                    status (enum: active|discharged|transferred, default active),
                    discharge_summary, notes,
                    payment_mode (enum: cash|insurance|card|corporate|government),
                    insurance_provider, insurance_policy_no, corporate_account,
                    tenantId (required, indexed)
custom_fields:      Record<string, any> (Mixed)
module_key:         "admission"
```

#### INVOICES (invoice.schema.ts)
```
Root fields:        invoice_number (required, unique), order_id, amount,
                    status (default 'draft'), tenantId (required, indexed)
custom_fields:      Record<string, any> (Mixed) — stores source_type, source_number, vendor_name
module_key:         "invoice"
```

#### ROOMS (room.schema.ts)
```
Root fields:        room_number (required, unique per tenant), floor,
                    type (required, enum: general|semi_private|private|icu|deluxe|suite),
                    status (enum: available|occupied|maintenance|reserved, default available),
                    bed_capacity (default 1), occupied_beds (default 0),
                    daily_rate (required), amenities[], department,
                    tenantId (required, indexed)
custom_fields:      Record<string, any> (Mixed)
module_key:         "room"
```

#### MEDICATIONS (medication.schema.ts)
```
Root fields:        drug_code (required, unique per tenant), name (required),
                    generic_name, dosage_form (enum: tablet|capsule|syrup|injection|
                      cream|drops|inhaler|other),
                    strength, price_per_unit, stock_quantity (default 0),
                    manufacturer, category, is_active (default true),
                    tenantId (required, indexed)
custom_fields:      NONE — catalog entity
module_key:         "medication"
```

#### FULFILLMENTS (fulfillment.schema.ts)
```
Root fields:        fulfillment_number (required, unique), po_id (required),
                    items[] (Mixed array),
                    status (required, enum: draft|partial|complete|discrepancy)
custom_fields:      Record<string, any> (Mixed)
NOTE:               Missing tenantId — needs to be added
module_key:         "fulfillment"
```

#### QUOTATIONS (quotation.schema.ts)
```
Root fields:        quotation_number (required, unique), vendor_id (required),
                    customer_id (required), items[] (Mixed array),
                    status (required, enum: draft|sent|approved|rejected|expired),
                    valid_until (Date, required), remarks,
                    pricing ({subtotal, tax_amount, total_amount, currency} Mixed),
                    terms ({payment_terms, delivery_terms, validity_days} Mixed)
custom_fields:      Record<string, any> (Mixed)
NOTE:               Missing tenantId — needs to be added
module_key:         "quotation"
```

#### STOCK ADJUSTMENTS (stock-adjustment.schema.ts)
```
Root fields:        adjustment_number (required, unique per tenant),
                    location_id, location, items[] (Mixed array),
                    status (default 'draft'), notes,
                    tenantId (required, indexed)
custom_fields:      Record<string, any> (Mixed)
module_key:         "stock_adjustment"
```

#### STOCK TRANSFERS (stock-transfer.schema.ts)
```
Root fields:        transfer_number (required, unique per tenant),
                    from_location_id, from_location, to_location_id, to_location,
                    items[] (Mixed array), status (default 'draft'),
                    notes, priority (default 'low'), expected_date,
                    tenantId (required, indexed)
custom_fields:      Record<string, any> (Mixed)
module_key:         "stock_transfer"
```

#### TAX (tax.schema.ts — GLOBAL, no tenantId)
```
Root fields:        tax_code (required, unique globally), name (required),
                    description, rate (required), rate_type (required, enum: percentage|fixed),
                    applicable_on (required, enum: sales|purchase|both, default both),
                    status (required, enum: active|inactive|archived, default active),
                    jurisdiction, tax_category, effective_from (Date), effective_to (Date),
                    components[] ({name, rate, description} Mixed),
                    priority (default 0), is_inclusive (default false),
                    is_compound (default false),
                    configuration ({min_amount, max_amount, exempt_threshold, reverse_charge} Mixed)
custom_fields:      Record<string, any> (Mixed)
NOTE:               No tenantId — tax rates are global across all tenants
```

#### USERS (user.schema.ts — under auth/)
```
Root fields:        username (required, unique), password_hash (required),
                    roles[] (string array), tenantId (required)
custom_fields:      NONE — system entity
NOTE:               Minimal schema. Extended user profile fields (email, name, phone, etc.)
                    should be added when implementing the Settings/User Management module
```

---

## Schema Configuration JSON Files

Each module has a JSON file in `schema-configs/` that defines the initial tenant field configuration. These are loaded by `scripts/setup-schemas.sh`.

Example: `schema-configs/vendors.json`
```json
{
  "fields": [
    { "field_id": "category",       "label": "Category",       "type": "enum",    "values": ["Pharmaceutical","Medical Devices","Laboratory","Distributor","Wholesaler","Retailer"], "required": true },
    { "field_id": "status",         "label": "Status",         "type": "enum",    "values": ["Active","Inactive","Pending"], "required": true },
    { "field_id": "email",          "label": "Email",          "type": "string",  "required": true },
    { "field_id": "phone",          "label": "Phone",          "type": "string",  "required": true },
    { "field_id": "city",           "label": "City",           "type": "string",  "required": false },
    { "field_id": "state",          "label": "State",          "type": "string",  "required": false },
    { "field_id": "gst_number",     "label": "GST Number",     "type": "string",  "required": false },
    { "field_id": "payment_methods","label": "Payment Methods", "type": "enum",   "values": ["Cash","Credit Card","Bank Transfer","Cheque","UPI","Net-30","Net-60","COD"], "required": true },
    { "field_id": "risk_level",     "label": "Risk Level",     "type": "enum",    "values": ["Low","Medium","High"], "required": false }
  ]
}
```

Setup command:
```bash
# Load all module configs for a tenant
./scripts/setup-schemas.sh

# Or one module at a time
curl -X POST http://localhost:3000/tenants/default_tenant/config/vendor/fields \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d @schema-configs/vendors.json
```

### What Each JSON File Defines

| File | module_key | Fields configured |
|------|-----------|-------------------|
| vendors.json | vendor | category, status, email, phone, city, state, gst_number, payment_methods, risk_level, etc. |
| purchase-orders.json | purchase_order | priority, department, budget_code, approval_notes, etc. |
| sales-orders.json | sales_order | channel, region, discount_code, customer_segment, etc. |
| inventory.json | inventory | category, sale_unit, barcode_type, manufacturer, expiry_date, supplier_name, etc. |
| doctors.json | doctor | gender, department, specialisation, qualification, experience, consultation_fee, status, etc. |
| patients.json | patient | dob, gender, blood_group, allergies, medical_history, address, city, state, emergency_contact, insurance, status, etc. |
| diagnostics.json | diagnostic | test_name, category, sample_type, booking_date, status, price, ordered_by, etc. |
| hospital-billing.json | hospital_billing | payment_method, notes, discharge_summary, etc. |

---

## Implementing a New Module (Step-by-Step)

To add a new module that follows this pattern:

### Step 1: Create Mongoose Schema
```typescript
// new-module/schemas/new-module.schema.ts
@Schema({ timestamps: true })
export class NewModule extends BaseSchema {
  @Prop({ required: true, unique: true })
  module_code: string;         // Business identifier

  @Prop({ required: true })
  name: string;                // Core display field

  // Add FKs if referential integrity needed
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'OtherModule' })
  other_module_id: string;

  // Structural arrays if needed
  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  items: Record<string, any>[];

  @Prop({ default: 'draft' })
  status: string;

  // ALWAYS include these two
  @Prop({ type: MongooseSchema.Types.Mixed })
  custom_fields: Record<string, any>;

  @Prop({ required: true, index: true })
  tenantId: string;
}
```

### Step 2: Create DTO
```typescript
// new-module/dto/create-new-module.dto.ts
export class CreateNewModuleDto {
  @IsString() module_code: string;
  @IsString() name: string;
  @IsOptional() @IsString() other_module_id?: string;
  @IsOptional() custom_fields?: Record<string, any>;
}
```

### Step 3: Create Service (follow vendor pattern exactly)
```typescript
async create(dto, userId, tenantId) {
  // 1. Validate custom_fields against tenant field config
  const fieldConfigs = await this.tenantsService.getFieldConfiguration(tenantId, 'new_module');
  if (fieldConfigs?.length) {
    for (const fc of fieldConfigs) {
      if (fc.required && !dto.custom_fields?.[fc.field_id]) {
        throw new BadRequestException(`${fc.label} is required.`);
      }
    }
  }
  // 2. Validate FK references
  // 3. Check uniqueness within tenant
  // 4. Save with tenantId, createdBy, updatedBy
  // 5. Audit log
}
```

### Step 4: Create Schema Config JSON
```json
// schema-configs/new-module.json
{
  "fields": [
    { "field_id": "category", "label": "Category", "type": "enum", "values": [...], "required": true },
    { "field_id": "description", "label": "Description", "type": "string", "required": false }
  ]
}
```

### Step 5: Add to setup-schemas.sh
```bash
MODULES=("vendor" "purchase_order" ... "new_module")
```

---

## Field Naming Convention

### CRITICAL for frontend-backend alignment:
- **Database/API**: snake_case (`vendor_id`, `po_number`, `created_by`)
- **Frontend/TS**: camelCase (`vendorId`, `poNumber`, `createdBy`)
- **Conversion happens in**: Frontend service layer

### Field Configuration Format
```json
{
  "field_id": "vendor_name",      // Used in API
  "label": "Vendor Name",         // Shown in UI
  "type": "string|enum|date|boolean",
  "values": ["Option1", "Option2"],  // For enum only
  "required": true|false
}
```

---

## Important Enums & Constants

### Roles
```typescript
Admin, Manager, User, Viewer, Doctor, Billing Staff, Receptionist, Pharmacist, Lab Technician, Nurse
```

### Scopes (Module Access — from scopes.enum.ts)
```typescript
vendors, tenants, invoices, purchase-orders, sales-orders
user-management, system-admin
patients, doctors, rooms, admissions, diagnostics, medications, hospital-billing, inventory
tax, addresses, discounts, settings
```

### Status Values (from actual schema enums)
- **PO**: draft (default) — no enum constraint in schema, free-text
- **SO**: draft (default) — no enum constraint in schema, free-text
- **Doctors**: active, on_leave, inactive (default: active)
- **Patients**: active, admitted, discharged, deceased (default: active)
- **Diagnostics**: ordered, pending, scheduled, in_progress, completed, cancelled (default: pending)
- **Diagnostic Priority**: routine, urgent, emergency, stat (default: routine)
- **Admissions**: active, discharged, transferred (default: active)
- **Admission Type**: planned, emergency, transfer, day_care
- **Hospital Billing**: draft, issued, partially_paid, paid, cancelled, overdue (default: draft)
- **Rooms**: available, occupied, maintenance, reserved (default: available)
- **Room Type**: general, semi_private, private, icu, deluxe, suite
- **Tax**: active, inactive, archived (default: active)
- **Medication Dosage Form**: tablet, capsule, syrup, injection, cream, drops, inhaler, other

### Payment Methods
```typescript
Cash, Credit Card, Bank Transfer, Cheque, UPI, Net-30, Net-60, COD, Insurance
```

---

## Common Development Tasks

### Start Backend
```bash
# With Docker (recommended)
docker-compose up -d backend

# Or locally (requires MongoDB + Kafka running)
npm install
npm run start:dev
```

### Run Seed Scripts
```bash
# Seed all data (medicines, doctors, etc.)
npm run seed:standalone

# Seed from existing medications
npm run seed:inventory

# Create PO/SO orders
npm run seed:orders
```

### Configure Schemas (NEW)
```bash
# Automated setup for all 8 modules
./scripts/setup-schemas.sh

# Or manually for one module
curl -X POST http://localhost:3000/tenants/default_tenant/config/vendors/fields \
  -H "Authorization: Bearer <TOKEN>" \
  -d @schema-configs/vendors.json
```

### Generate Migrations
```bash
npm run typeorm migration:create src/migrations/MigrationName
npm run typeorm migration:run
```

### View API Documentation
Open browser: `http://localhost:3000/api`
Swagger automatically generated from code decorators

### Run Tests
```bash
npm test                    # Unit tests
npm run test:e2e          # End-to-end tests
npm run test:cov          # With coverage
```

---

## Environment Variables

### Critical (set in docker-compose.yml or .env)
```
NODE_ENV=development
PORT=3000

# Database
MONGO_URI=mongodb://root:rootpassword@mongodb:27017/medsystem?authSource=admin

# Kafka
KAFKA_BROKERS=kafka:29092

# Auth
JWT_SECRET=a-very-secret-key
ENCRYPTION_KEY=0000...0001
ENCRYPTION_HMAC_KEY=0000...0002

# CORS
CORS_ORIGIN=http://localhost:8080
```

---

## Service Layer Patterns

Each service follows this standard pattern with proper transaction handling and event emission:

```typescript
// vendors/vendors.service.ts
export class VendorsService {
  constructor(
    @InjectModel(Vendor.name) private vendorModel: Model<Vendor>,
    private auditService: AuditService,
    private kafkaService: KafkaService  // For event emission
  ) {}

  // CREATE with validation and audit
  async create(
    dto: CreateVendorDto,
    tenantId: string,
    userId: string
  ): Promise<Vendor> {
    // Validate uniqueness
    const exists = await this.vendorModel.findOne({ vendor_id: dto.vendor_id, tenantId });
    if (exists) throw new ConflictException('Vendor ID already exists');

    // Create
    const vendor = await this.vendorModel.create({
      ...dto,
      tenantId,
      createdBy: userId,
      updatedBy: userId
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId,
      action: 'CREATE',
      entity: 'Vendor',
      entityId: vendor._id.toString(),
      newValue: vendor
    });

    return vendor;
  }

  // READ with pagination
  async getAll(
    tenantId: string,
    query: QueryParamsDto
  ): Promise<PaginatedResponse<Vendor>> {
    // Build query
    const { mongoQuery, options, pagination } = this.queryBuilder.build(query, { tenantId });

    // Count total
    const total = await this.vendorModel.countDocuments(mongoQuery);

    // Fetch with pagination
    const items = await this.vendorModel
      .find(mongoQuery)
      .skip(options.skip)
      .limit(options.limit)
      .sort(options.sort)
      .exec();

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
      hasMore: pagination.page < Math.ceil(total / pagination.limit)
    };
  }

  // UPDATE with validation
  async update(
    id: string,
    dto: UpdateVendorDto,
    tenantId: string,
    userId: string
  ): Promise<Vendor> {
    // Verify ownership
    const vendor = await this.vendorModel.findOne({ _id: id, tenantId });
    if (!vendor) throw new NotFoundException('Vendor not found');

    // Store old value for audit
    const oldValue = vendor.toObject();

    // Update
    const updated = await this.vendorModel.findByIdAndUpdate(
      id,
      {
        ...dto,
        updatedBy: userId,
        updatedAt: new Date()
      },
      { new: true }
    );

    // Audit log
    await this.auditService.log({
      tenantId,
      userId,
      action: 'UPDATE',
      entity: 'Vendor',
      entityId: id,
      oldValue,
      newValue: updated
    });

    return updated;
  }

  // DELETE with validation
  async delete(id: string, tenantId: string, userId: string): Promise<void> {
    const vendor = await this.vendorModel.findOne({ _id: id, tenantId });
    if (!vendor) throw new NotFoundException('Vendor not found');

    // Check for references (POs, Inventory items)
    const referencingPOs = await this.poModel.countDocuments({ vendor_id: id, tenantId });
    if (referencingPOs > 0) {
      throw new BadRequestException('Cannot delete vendor with active purchase orders');
    }

    // Delete
    await this.vendorModel.deleteOne({ _id: id, tenantId });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId,
      action: 'DELETE',
      entity: 'Vendor',
      entityId: id,
      oldValue: vendor
    });
  }
}
```

---

## API Endpoints Structure

### Authentication
```
POST /auth/login → Returns JWT token with roles & scopes
```

### Tenants (Multi-Tenant Management)
```
POST /tenants                                    [Admin only]
GET /tenants                                     [Admin/Manager]
GET /tenants/:id                                 [Admin/Manager]
PATCH /tenants/:id                               [Admin only]
POST /tenants/:id/config/:module/fields         [Admin/Manager] ← NEW
GET /tenants/:id/schema?module=:module          [Any authenticated]
```

### Business Modules Pattern
```
POST   /:module                                  [Create]
GET    /:module                                  [List with filters]
GET    /:module/:id                              [Single record]
PATCH  /:module/:id                              [Update]
DELETE /:module/:id                              [Delete]
```

**Example**: `/vendors`, `/purchase-orders`, `/inventory`, `/patients`

### Lookup Endpoints (Auto-Suggest Dropdowns — to implement)
```
GET    /vendors/lookup?search=&limit=25           [Vendor dropdown for PO, Inventory]
GET    /patients/lookup?search=&limit=25          [Patient dropdown for Diagnostics, Admissions]
GET    /doctors/lookup?search=&limit=25           [Doctor dropdown for Diagnostics, Admissions]
GET    /inventory/lookup?search=&limit=25         [Inventory dropdown for PO/SO items]
GET    /tax/lookup                                [Tax dropdown for Billing, Vendors, Inventory]
GET    /rooms/lookup?search=&limit=25             [Room dropdown for Admissions]
GET    /medications/lookup?search=&limit=25       [Medication dropdown for prescriptions]
GET    /diagnostic-tests/lookup?search=&limit=25  [Test catalog dropdown for bookings]
```

### User Management (Admin Only — to implement, current User schema is minimal)
```
GET    /users                                     [List users, paginated]
GET    /users/:id                                 [Get user detail]
POST   /users                                     [Create user]
PATCH  /users/:id                                 [Update user role, scopes, status]
DELETE /users/:id                                 [Delete user]
POST   /users/:id/change-password                 [Reset password]
```

### Existing Support Modules
```
POST   /tax              GET /tax              PATCH /tax/:id        DELETE /tax/:id
POST   /rooms            GET /rooms            PATCH /rooms/:id      DELETE /rooms/:id
POST   /medications      GET /medications      PATCH /medications/:id DELETE /medications/:id
```

### TODO Support Modules (not yet created)
```
POST   /discounts          GET /discounts          PATCH /discounts/:id    DELETE /discounts/:id
POST   /addresses          GET /addresses          PATCH /addresses/:id    DELETE /addresses/:id
```

### Module-Specific Endpoints
```
POST   /purchase-orders/:id/approve              [Approve PO]
POST   /admissions/:id/discharge                 [Discharge patient → creates bill + Kafka event]
POST   /diagnostics/:id/complete                 [Complete test → creates bill + Kafka event]
POST   /inventory/:id/adjust-stock               [Adjust stock level]
POST   /stock/adjustments                        [Create stock adjustment]
POST   /stock/transfers                          [Create stock transfer]
POST   /quotations                               [Create quotation]
POST   /fulfillments                             [Create goods receipt for PO]
```

---

## Enum Patterns in Backend

### Actual Enum Files (from codebase)

The system has **two** enum files — roles and scopes. All other status/category values are defined as **inline string enums in schemas** or as **tenant-configurable enum fields in custom_fields**.

```typescript
// auth/enums/roles.enum.ts (also mirrored in common/enums/)
export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  VIEWER = 'viewer',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  RECEPTIONIST = 'receptionist',
  BILLING_STAFF = 'billing_staff',
  LAB_TECHNICIAN = 'lab_technician',
  PHARMACIST = 'pharmacist',
}

// auth/enums/scopes.enum.ts (also mirrored in common/enums/)
export enum Scope {
  VENDORS = 'vendors',
  TENANTS = 'tenants',
  INVOICES = 'invoices',
  PURCHASE_ORDERS = 'purchase-orders',
  SALES_ORDERS = 'sales-orders',
  USER_MANAGEMENT = 'user-management',
  SYSTEM_ADMIN = 'system-admin',
  PATIENTS = 'patients',
  DOCTORS = 'doctors',
  ROOMS = 'rooms',
  ADMISSIONS = 'admissions',
  DIAGNOSTICS = 'diagnostics',
  MEDICATIONS = 'medications',
  HOSPITAL_BILLING = 'hospital-billing',
  INVENTORY = 'inventory',
  TAX = 'tax',
  ADDRESSES = 'addresses',
  DISCOUNTS = 'discounts',
  SETTINGS = 'settings',
}
```

### Inline Schema Enums (how statuses work in actual code)

Status values are defined directly in schema `@Prop()` decorators, NOT in separate enum files:

```typescript
// Example from doctor.schema.ts — inline enum
@Prop({
  type: String,
  enum: ['active', 'on_leave', 'inactive'],
  default: 'active',
})
status: string;

// Example from admission.schema.ts — inline enum
@Prop({
  required: true,
  type: String,
  enum: ['planned', 'emergency', 'transfer', 'day_care'],
})
admission_type: string;
```

### Tenant-Configurable Enums (via fieldConfigurations)

For fields stored in `custom_fields`, enum values are defined in the tenant's field configuration:

```json
{
  "field_id": "category",
  "label": "Vendor Category",
  "type": "enum",
  "values": ["Pharmaceutical", "Medical Devices", "Laboratory"],
  "required": true
}
```

These are NOT validated at the schema level — they are validated by the service layer against the tenant's `fieldConfigurations`.

### When to Create New Enum Files vs Inline vs custom_fields

| Approach | When to use | Example |
|----------|------------|---------|
| **Enum file** (common/enums/) | System-wide, never changes per tenant | Role, Scope |
| **Inline schema enum** | Fixed business logic, same for all tenants | admission_type, diagnostic status, room type |
| **custom_fields enum** (fieldConfigurations) | Tenant-customisable dropdown | vendor category, risk_level, department |

---

## Pagination Pattern in Backend

All list endpoints MUST support pagination with a maximum of **25 items per page**.

### Query Builder Service Pattern

```typescript
// common/services/query-builder.service.ts
export class QueryBuilderService {
  build(query: any, filters?: Record<string, any>) {
    // Always paginate
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(parseInt(query.limit) || 25, 25);  // Cap at 25
    const skip = (page - 1) * limit;

    let mongoQuery = {};

    // Apply tenant isolation
    if (filters?.tenantId) {
      mongoQuery['tenantId'] = filters.tenantId;
    }

    // Apply filters
    if (filters?.search) {
      mongoQuery['$or'] = [
        { name: { $regex: filters.search, $options: 'i' } },
        { vendor_name: { $regex: filters.search, $options: 'i' } }
      ];
    }

    if (filters?.status) {
      mongoQuery['status'] = filters.status;
    }

    // Apply sorting
    let sortObj = {};
    if (query.sort) {
      const [field, order] = query.sort.split(':');
      sortObj[field] = order === 'desc' ? -1 : 1;
    } else {
      sortObj['created_at'] = -1;  // Default: newest first
    }

    return {
      query: mongoQuery,
      options: {
        skip,
        limit,
        sort: sortObj
      },
      pagination: {
        page,
        limit,
        skip
      }
    };
  }
}
```

### Service Method Pattern

```typescript
// vendors/vendors.service.ts
async getAll(
  tenantId: string,
  query: QueryParamsDto
): Promise<PaginatedResponse<Vendor>> {
  const { query: mongoQuery, options, pagination } = this.queryBuilder.build(query, { tenantId });

  // Fetch count first
  const total = await this.vendorModel.countDocuments(mongoQuery);

  // Fetch data with pagination
  const items = await this.vendorModel
    .find(mongoQuery)
    .skip(options.skip)
    .limit(options.limit)
    .sort(options.sort)
    .exec();

  const totalPages = Math.ceil(total / pagination.limit);

  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages,
    hasMore: pagination.page < totalPages
  };
}
```

### Controller Endpoint Pattern

```typescript
// vendors/vendors.controller.ts
@Get()
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
@Scopes(Scope.VENDORS)
async getAll(
  @Query() query: QueryParamsDto,
  @Req() req: RequestWithUser
): Promise<PaginatedResponse<Vendor>> {
  return this.vendorService.getAll(req.user.tenantId, query);
}
```

### Query Params DTO

```typescript
// common/dto/query-params.dto.ts
export class QueryParamsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(25)  // Enforce max 25
  limit?: number = 25;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sort?: string;  // Format: "field:asc" or "field:desc"

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  category?: string;

  // ... other optional filters
}

export class PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}
```

---

## Auto-Suggest / Lookup Endpoints

The frontend uses auto-suggest dropdowns for relational fields (vendor selector on PO, patient selector on diagnostics, inventory picker on order items, etc.). The backend must expose lightweight lookup endpoints that return minimal data for dropdown rendering.

### Lookup Endpoint Pattern

Each entity that is referenced by other entities needs a lookup endpoint:

```typescript
// vendors/vendors.controller.ts
@Get('lookup')
@UseGuards(JwtAuthGuard)
@Scopes(Scope.VENDORS)
@ApiOperation({ summary: 'Lightweight vendor list for dropdowns' })
async lookup(
  @Query('search') search: string,
  @Query('limit') limit: number = 25,
  @Req() req: RequestWithUser
): Promise<LookupOption[]> {
  return this.vendorsService.lookup(req.user.tenantId, search, Math.min(limit, 25));
}
```

```typescript
// vendors/vendors.service.ts
async lookup(tenantId: string, search?: string, limit: number = 25): Promise<LookupOption[]> {
  const query: any = { tenantId };
  if (search) {
    query['$or'] = [
      { name: { $regex: search, $options: 'i' } },
      { vendor_id: { $regex: search, $options: 'i' } }
    ];
  }

  const vendors = await this.vendorModel
    .find(query)
    .select('_id vendor_id name phone email city')  // Only fields needed for display
    .limit(limit)
    .sort({ name: 1 })
    .lean()
    .exec();

  return vendors.map(v => ({
    value: v._id.toString(),
    label: v.name,
    code: v.vendor_id,
    phone: v.phone,
    email: v.email,
    city: v.city
  }));
}
```

### Required Lookup Endpoints

| Endpoint | Used By | Returns |
|----------|---------|---------|
| `GET /vendors/lookup?search=` | InventoryItem (supplier), PurchaseOrder (vendor) | value, label, code, phone, email |
| `GET /patients/lookup?search=` | Diagnostics, Admissions, Hospital Billing | value, label, code (patient_id), phone |
| `GET /doctors/lookup?search=` | Diagnostics (ordered_by), Admissions (attending doctor) | value, label, department, specialisation |
| `GET /inventory/lookup?search=` | PurchaseOrderItem, SalesOrderItem | value, label, sku, unit_price, current_stock |
| `GET /tax-slabs/lookup` | Billing, Hospital Billing, Invoices | value, label, rate (percentage) |
| `GET /discounts/lookup` | Billing, Orders | value, label, type (percentage/flat), amount |
| `GET /payment-methods/lookup` | PO, SO, Billing | value, label (from PaymentMethod enum) |
| `GET /addresses/lookup?search=` | PO, SO (shipping address) | value, label, full_address, city, state, pin_code |

### Lookup Response Shape

```typescript
// common/interfaces/lookup.interface.ts
export interface LookupOption {
  value: string;       // _id for storage as FK
  label: string;       // Display text in dropdown
  code?: string;       // Business identifier (vendor_id, patient_id, sku)
  [key: string]: any;  // Additional fields for auto-fill on selection
}
```

### How Frontend Uses Lookups

When a user selects a vendor in PO form:
1. Frontend calls `GET /vendors/lookup?search=pharma`
2. Backend returns `[{ value: "abc123", label: "PharmaCorp", code: "V001", phone: "9876...", email: "..." }]`
3. User picks "PharmaCorp"
4. Frontend auto-fills: `vendor_id = "abc123"`, `vendor_name = "PharmaCorp"`, `vendor_phone = "9876..."`, `vendor_email = "..."`
5. On save, all denormalized fields are sent to backend

---

## Date & Time Auto-Population (Service Layer)

Date fields should be auto-populated in the service layer, not the controller or frontend.

### Pattern

```typescript
// purchase-orders/purchase-orders.service.ts
async create(
  dto: CreatePurchaseOrderDto,
  tenantId: string,
  userId: string
): Promise<PurchaseOrder> {
  const now = new Date();

  // Auto-populate dates
  const enrichedDto = {
    ...dto,
    order_date: dto.order_date || now.toISOString(),
    delivery_date: dto.delivery_date || new Date(
      now.getTime() + (dto.delivery_lead_days || 7) * 24 * 60 * 60 * 1000
    ).toISOString(),
    status: dto.status || OrderStatus.PENDING,
    paid_amount: dto.paid_amount || 0,
    tenantId,
    createdBy: userId,
    updatedBy: userId
  };

  // Calculate item totals
  enrichedDto.items = enrichedDto.items.map(item => ({
    ...item,
    total: item.quantity * item.unit_price
  }));

  // Calculate order total
  enrichedDto.total = enrichedDto.items.reduce((sum, item) => sum + item.total, 0);

  const po = await this.poModel.create(enrichedDto);
  return po;
}
```

### Auto-Population Rules

| Field | Module | Rule |
|-------|--------|------|
| `order_date` | PO, SO | `new Date().toISOString()` if not provided |
| `delivery_date` | PO | `order_date + 7 days` default |
| `delivery_date` | SO | `order_date + 3 days` default |
| `booking_date` | Diagnostics | `new Date().toISOString()` always |
| `issued_date` | Hospital Bill | `new Date().toISOString()` on creation |
| `due_date` | Hospital Bill | `issued_date + 30 days` default |
| `created_at` | All modules | Handled by Mongoose `timestamps: true` |
| `updated_at` | All modules | Handled by Mongoose `timestamps: true` |
| `status` | PO, SO | Default: `'Pending'` |
| `status` | Billing | Default: `'Draft'` |
| `paid_amount` | PO, SO, Billing | Default: `0` |

---

## User & Auth Module (Actual from auth/)

User management lives under `auth/`, NOT a separate `users/` module. The current User schema is minimal — it needs to be extended for the Settings page.

### Actual User Schema (auth/schemas/user.schema.ts)

```typescript
@Schema({ timestamps: true })
export class User extends BaseSchema {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password_hash: string;

  @Prop([String])
  roles: string[];          // Array of Role enum values

  @Prop({ required: true })
  tenantId: string;
}
```

### Actual Auth Module Files

```
auth/
├── auth.controller.ts              [Login endpoint]
├── auth.service.ts                 [Login logic, JWT generation]
├── auth.module.ts
├── jwt-auth.guard.ts               [Validates JWT token on requests]
├── jwt.strategy.ts                 [Passport JWT strategy]
├── roles.guard.ts                  [Checks user has required Role]
├── scopes.guard.ts                 [Checks user has required Scope]
├── roles.decorator.ts              [@Roles() decorator]
├── scopes.decorator.ts             [@Scopes() decorator]
├── schemas/
│   ├── user.schema.ts              [username, password_hash, roles[], tenantId]
│   └── role.schema.ts
├── enums/
│   ├── roles.enum.ts               [ADMIN, MANAGER, USER, VIEWER, DOCTOR, etc.]
│   └── scopes.enum.ts              [VENDORS, PATIENTS, DOCTORS, etc.]
├── permissions/
│   └── permissions.matrix.ts       [Role → Scope mapping]
└── dto/
    ├── login.dto.ts
    ├── create-user.dto.ts
    ├── update-user.dto.ts
    ├── create-role.dto.ts
    ├── update-role.dto.ts
    └── auth-response.dto.ts
```

### TODO: Extend User Schema for Settings Page

The current schema only stores `username`, `password_hash`, `roles[]`, `tenantId`. To support the frontend Settings page, the User schema needs:
- `email` (required, unique per tenant)
- `first_name`, `last_name`
- `scopes[]` (separate from roles — fine-grained module access)
- `status` (active/inactive)
- `phone` (optional)
- `last_login` (Date, optional)

This should follow the same hybrid pattern — fixed root fields + `custom_fields` bag for tenant-specific user profile fields.

---

## Existing Support Modules (Actual from codebase)

These modules exist in the codebase with full controller/service/schema/dto structure.

### Tax Module (tax/ — GLOBAL, no tenantId)

```
tax/
├── tax.controller.ts
├── tax.service.ts
├── tax.module.ts
├── schemas/
│   └── tax.schema.ts
└── dto/
    ├── create-tax.dto.ts
    ├── update-tax.dto.ts
    └── tax-response.dto.ts
```

**Actual tax.schema.ts root fields:**
```
tax_code (required, unique globally), name (required), description,
rate (required), rate_type (required, enum: percentage|fixed),
applicable_on (required, enum: sales|purchase|both),
status (required, enum: active|inactive|archived),
jurisdiction, tax_category,
effective_from (Date), effective_to (Date),
components[] ({name, rate, description}),
priority, is_inclusive, is_compound,
configuration ({min_amount, max_amount, exempt_threshold, reverse_charge}),
custom_fields: Record<string, any>
```
**NOTE**: Tax has NO tenantId — tax rates are shared across all tenants. Referenced by Vendor (applicable_tax_ids), Inventory (applicable_tax_ids), and HospitalBill (line_items.tax_ids).

### Rooms Module (rooms/)

```
rooms/
├── rooms.controller.ts
├── rooms.service.ts
├── rooms.module.ts
├── schemas/
│   └── room.schema.ts
└── dto/
    ├── create-room.dto.ts
    └── update-room.dto.ts
```

**Actual room.schema.ts root fields:**
```
room_number (required, unique per tenant), floor,
type (required, enum: general|semi_private|private|icu|deluxe|suite),
status (enum: available|occupied|maintenance|reserved, default available),
bed_capacity (default 1), occupied_beds (default 0),
daily_rate (required), amenities[], department,
tenantId (required, indexed),
custom_fields: Record<string, any>
```

### Medications Module (medications/)

```
medications/
├── medications.controller.ts
├── medications.service.ts
├── medications.module.ts
├── schemas/
│   ├── medication.schema.ts
│   └── patient-medication.schema.ts
└── dto/
    ├── create-medication.dto.ts
    ├── update-medication.dto.ts
    ├── create-patient-medication.dto.ts
    └── update-patient-medication.dto.ts
```

**Actual medication.schema.ts root fields:**
```
drug_code (required, unique per tenant), name (required),
generic_name, dosage_form (enum: tablet|capsule|syrup|injection|cream|drops|inhaler|other),
strength, price_per_unit, stock_quantity (default 0),
manufacturer, category, is_active (default true),
tenantId (required, indexed)
```
**NOTE**: Medication has NO custom_fields — it's a catalog entity. Consider adding custom_fields for tenant-specific drug information.

### TODO Support Modules (not yet created)

These modules are referenced in the frontend but don't exist in the backend yet:
- **discounts/** — discount configurations (percentage/flat, min_order_value)
- **addresses/** — shipping & billing address management

---

## Consistent GET /:id Response Shape

All single-record endpoints must return the same response structure. This ensures the frontend detail/edit pages render consistently.

### Response Pattern

```typescript
// Every GET /:id returns the full record with metadata
{
  "id": "ObjectId",
  // ... all business fields for the entity ...
  "tenantId": "default_tenant",
  "createdBy": "admin",
  "updatedBy": "admin",
  "createdAt": "2026-05-24T10:00:00.000Z",
  "updatedAt": "2026-05-24T10:00:00.000Z"
}
```

### Controller Pattern for Detail Endpoint

```typescript
@Get(':id')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
@Scopes(Scope.VENDORS)
@ApiOperation({ summary: 'Get vendor by ID' })
@ApiResponse({ status: 200, description: 'Vendor details' })
@ApiResponse({ status: 404, description: 'Vendor not found' })
async getOne(
  @Param('id') id: string,
  @Req() req: RequestWithUser
): Promise<Vendor> {
  return this.vendorsService.getOne(id, req.user.tenantId);
}
```

### Service Pattern for Detail

```typescript
async getOne(id: string, tenantId: string): Promise<Vendor> {
  const vendor = await this.vendorModel
    .findOne({ _id: id, tenantId })
    .exec();

  if (!vendor) {
    throw new NotFoundException(`Vendor with ID ${id} not found`);
  }

  return vendor;
}
```

### Update Endpoint - PATCH /:id

```typescript
@Patch(':id')
@UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Scopes(Scope.VENDORS)
@ApiOperation({ summary: 'Update vendor' })
async update(
  @Param('id') id: string,
  @Body() dto: UpdateVendorDto,
  @Req() req: RequestWithUser
): Promise<Vendor> {
  return this.vendorsService.update(id, dto, req.user.tenantId, req.user.id);
}
```

### Consistency Rules for All Modules

1. **GET /:id** always returns full record including metadata (createdBy, createdAt, etc.)
2. **PATCH /:id** accepts partial body, returns full updated record
3. **404** if record not found or belongs to different tenant
4. **RBAC** applied consistently: read = any role with scope, write = Admin/Manager
5. **Audit** logged on every update with oldValue/newValue
6. All response objects exclude sensitive fields (password_hash, etc.)

---

## Kafka Event System

### Topics
- **billing-events** - All billing-related events

### Event Types
```typescript
// From PO/SO creation
{
  eventType: "purchase_order.created" | "sales_order.created",
  entity_id: string,
  entity_type: "purchase_order" | "sales_order",
  amount: number,
  po_number: string,
  vendor_name: string,
  tenantId: string,
  createdBy: string,
  timestamp: ISO8601
}

// From Admission discharge
{
  eventType: "patient.discharge.completed",
  entity_id: string,
  entity_type: "admission",
  patient_id: string,
  admission_id: string,
  admission_number: string,
  room_charges: number,
  tenantId: string,
  createdBy: string,
  timestamp: ISO8601
}

// From Diagnostic completion
{
  eventType: "diagnostic.completed",
  entity_id: string,
  entity_type: "diagnostic_booking",
  patient_id: string,
  booking_number: string,
  test_name: string,
  price: number,
  tenantId: string,
  createdBy: string,
  timestamp: ISO8601
}
```

### Event Handlers
- **InvoicesEventHandler** - Creates Invoice on PO/SO creation
- **HospitalBillingEventHandler** - Creates Hospital Bill on discharge/diagnostic completion

---

## Database Collections (Actual from Mongoose schemas)

All collections follow the hybrid pattern: root fields + `custom_fields` (Mixed) + `tenantId` + BaseSchema fields (id, createdBy, updatedBy) + timestamps (createdAt, updatedAt).

```
tenants                    [Multi-tenant config]
├─ name (unique), tenantId (unique, indexed)
├─ fieldConfigurations: Map<module_key, FieldConfiguration[]>
├─ createdBy, updatedBy, createdAt, updatedAt

vendors                    [Supplier management]
├─ vendor_code (unique/tenant), name, tax_id(@PII), legal_name
├─ address(@PII), contact_persons[](@PII), default_lead_time_days
├─ payment_terms, supported_tax_slabs[]
├─ applicable_tax_ids[] (FK→Tax), default_purchase_tax_id (FK→Tax)
├─ custom_fields, tenantId, createdBy, updatedBy, createdAt, updatedAt

purchaseorders             [Purchase orders]
├─ po_number (unique/tenant), vendor_id, vendor_name, vendor_phone, vendor_email, vendor_address
├─ shipping_address, order_date, delivery_date, fulfilment_date
├─ items[] (Mixed), grand_total, paid_amount, payment_method
├─ notes, approved_by, remarks[] (Mixed), status (default: draft)
├─ custom_fields, tenantId, createdBy, updatedBy, createdAt, updatedAt

salesorders                [Sales orders]
├─ so_number (unique/tenant), customer_id, customer_name, customer_email, customer_phone
├─ customer_address, shipping_address, billing_address
├─ order_date, due_date, delivery_date, items[] (Mixed)
├─ grand_total, paid_amount, payment_method, payment_status, status (default: draft), notes
├─ custom_fields, tenantId, createdBy, updatedBy, createdAt, updatedAt

inventoryitems             [Stock items]
├─ sku (unique/tenant), name, category, description, unit_of_measure, sale_unit
├─ unit_price, current_stock, min_stock_level, max_stock_level, reorder_quantity
├─ supplier (string), supplier_id (FK→Vendor), manufacturer, location
├─ batch_number, expiry_date, barcode, rfid_tag, applicable_tax_ids[] (FK→Tax)
├─ is_active, custom_fields, tenantId, createdBy, updatedBy, createdAt, updatedAt

doctors                    [Medical staff]
├─ employee_id (unique/tenant), name(@PII), gender, dob(@PII)
├─ phone(@PII), phone_search_hash, email(@PII), email_search_hash
├─ department, specialisation, qualification[], experience_years
├─ status (enum: active|on_leave|inactive), schedule[] ({day,start_time,end_time})
├─ consultation_fee, opd_slots_per_day, active_patient_count
├─ join_date, registration_no(@PII), bio, languages[]
├─ custom_fields, tenantId, createdBy, updatedBy, createdAt, updatedAt

patients                   [Patient records]
├─ patient_id (unique/tenant), first_name(@PII), last_name(@PII)
├─ gender, dob(@PII), phone(@PII), phone_search_hash, email(@PII), email_search_hash
├─ address(@PII), blood_group, emergency_contact_name(@PII), emergency_contact_phone(@PII)
├─ allergies[], existing_conditions[], barcode, rfid_tag
├─ status (enum: active|admitted|discharged|deceased), department
├─ assigned_doctor_id (FK→Doctor)
├─ custom_fields, tenantId, createdBy, updatedBy, createdAt, updatedAt

admissions                 [Patient admissions & discharge]
├─ admission_number (unique/tenant)
├─ patient_id (FK→Patient), room_id (FK→Room), doctor_id (FK→Doctor)
├─ admission_date (Date), expected_discharge_date, actual_discharge_date
├─ admission_type (enum: planned|emergency|transfer|day_care)
├─ status (enum: active|discharged|transferred)
├─ discharge_summary, notes, payment_mode (enum: cash|insurance|card|corporate|government)
├─ insurance_provider, insurance_policy_no, corporate_account
├─ custom_fields, tenantId, createdBy, updatedBy, createdAt, updatedAt

diagnostictests            [Test catalog]
├─ test_code (unique/tenant), name, category, price
├─ duration_minutes, preparation_instructions, department, description, is_active
├─ tenantId, createdBy, updatedBy, createdAt, updatedAt

patientdiagnostics         [Diagnostic bookings]
├─ booking_number (unique/tenant)
├─ patient_id (FK→Patient), test_id (FK→DiagnosticTest)
├─ ordered_by_doctor_id (FK→Doctor), ordered_date, scheduled_date, scheduled_time, completed_date
├─ status (enum: ordered|pending|scheduled|in_progress|completed|cancelled)
├─ priority (enum: routine|urgent|emergency|stat)
├─ price, results, result_file_url, notes, technician_id (FK→Doctor)
├─ tenantId, createdBy, updatedBy, createdAt, updatedAt

rooms                      [Hospital rooms]
├─ room_number (unique/tenant), floor
├─ type (enum: general|semi_private|private|icu|deluxe|suite)
├─ status (enum: available|occupied|maintenance|reserved)
├─ bed_capacity, occupied_beds, daily_rate, amenities[], department
├─ custom_fields, tenantId, createdBy, updatedBy, createdAt, updatedAt

medications                [Drug catalog]
├─ drug_code (unique/tenant), name, generic_name
├─ dosage_form (enum: tablet|capsule|syrup|injection|cream|drops|inhaler|other)
├─ strength, price_per_unit, stock_quantity, manufacturer, category, is_active
├─ tenantId, createdBy, updatedBy, createdAt, updatedAt

invoices                   [B2B invoices from PO/SO]
├─ invoice_number (unique), order_id, amount, status (default: draft)
├─ custom_fields (stores source_type, source_number, vendor_name)
├─ tenantId, createdBy, updatedBy, createdAt, updatedAt

hospitalbills              [Patient bills]
├─ invoice_number (unique/tenant), patient_id (FK→Patient), admission_id (FK→Admission)
├─ line_items[] ({description, category, quantity, unit_price, discount_percent, tax_ids[], subtotal, tax_amount, total})
├─ subtotal, total_tax, total_discount, grand_total, paid_amount
├─ status (enum: draft|issued|partially_paid|paid|cancelled|overdue)
├─ payment_mode, due_date, issued_date, notes
├─ tenantId, createdBy, updatedBy, createdAt, updatedAt

fulfillments               [PO goods receipt — MISSING tenantId]
├─ fulfillment_number (unique), po_id, items[] (Mixed), status
├─ custom_fields, createdBy, updatedBy, createdAt, updatedAt

quotations                 [Quotes — MISSING tenantId]
├─ quotation_number (unique), vendor_id, customer_id, items[] (Mixed)
├─ status, valid_until, remarks
├─ pricing ({subtotal, tax_amount, total_amount, currency})
├─ terms ({payment_terms, delivery_terms, validity_days})
├─ custom_fields, createdBy, updatedBy, createdAt, updatedAt

stockadjustments           [Stock adjustments]
├─ adjustment_number (unique/tenant), location_id, location
├─ items[] (Mixed), status, notes
├─ custom_fields, tenantId, createdBy, updatedBy, createdAt, updatedAt

stocktransfers             [Stock transfers]
├─ transfer_number (unique/tenant)
├─ from_location_id, from_location, to_location_id, to_location
├─ items[] (Mixed), status, notes, priority, expected_date
├─ custom_fields, tenantId, createdBy, updatedBy, createdAt, updatedAt

taxes                      [Tax config — GLOBAL, no tenantId]
├─ tax_code (unique), name, description, rate, rate_type
├─ applicable_on, status, jurisdiction, tax_category
├─ effective_from, effective_to, components[]
├─ priority, is_inclusive, is_compound, configuration
├─ custom_fields, createdBy, updatedBy, createdAt, updatedAt

users                      [Auth users — minimal schema]
├─ username (unique), password_hash, roles[], tenantId
├─ createdBy, updatedBy, createdAt, updatedAt

auditlogs                  [Audit trail]
├─ userId, action, entity, entityId
├─ oldValue, newValue, tenantId, timestamp
```

---

## Referential Integrity & Data Validation

### Referential Integrity Patterns (from actual schemas)

FK references use `MongooseSchema.Types.ObjectId` with `ref`. Validation happens in the service layer.

```typescript
// ACTUAL: InventoryItem → Vendor (supplier_id is optional ObjectId ref)
@Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Vendor' })
supplier_id: MongooseSchema.Types.ObjectId;

@Prop()
supplier: string;  // Denormalized supplier name (separate field)

// ACTUAL: Admission → Patient, Room, Doctor (all required ObjectId refs)
@Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Patient', required: true })
patient_id: MongooseSchema.Types.ObjectId;

@Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Room', required: true })
room_id: MongooseSchema.Types.ObjectId;

@Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Doctor', required: true })
doctor_id: MongooseSchema.Types.ObjectId;

// ACTUAL: Vendor → Tax (array of ObjectId refs)
@Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Tax' }] })
applicable_tax_ids: string[];

// Service-level validation pattern (from vendors.service.ts)
if (dto.applicable_tax_ids?.length > 0) {
  const validTaxes = await this.taxService.findByIds(dto.applicable_tax_ids);
  if (validTaxes.length !== dto.applicable_tax_ids.length) {
    throw new BadRequestException('One or more tax IDs are invalid or inactive.');
  }
}
```

### All FK Relationships in System

| Source | Field | Target | Required |
|--------|-------|--------|----------|
| Vendor | applicable_tax_ids[] | Tax | No |
| Vendor | default_purchase_tax_id | Tax | No |
| InventoryItem | supplier_id | Vendor | No |
| InventoryItem | applicable_tax_ids[] | Tax | No |
| Patient | assigned_doctor_id | Doctor | No |
| Admission | patient_id | Patient | Yes |
| Admission | room_id | Room | Yes |
| Admission | doctor_id | Doctor | Yes |
| PatientDiagnostic | patient_id | Patient | Yes |
| PatientDiagnostic | test_id | DiagnosticTest | Yes |
| PatientDiagnostic | ordered_by_doctor_id | Doctor | No |
| PatientDiagnostic | technician_id | Doctor | No |
| HospitalBill | patient_id | Patient | Yes |
| HospitalBill | admission_id | Admission | No |
| HospitalBill | line_items[].tax_ids[] | Tax | No |

### Field Validation Rules

```typescript
// common/decorators/validators.ts

// Phone number validation
export const phoneRegex = /^[0-9]{10}$/;  // 10 digits for India

// Email validation (built-in)
@IsEmail()
email: string;

// Currency validation
@IsNumber({ maxDecimalPlaces: 2 })
amount: number;

// Date validation
@IsDateString()
order_date: string;

// Enum validation
@IsEnum(['Active', 'Inactive', 'Pending'])
status: string;

// Custom validation example
@Custom({ message: 'Delivery date must be after order date' })
validateDates(obj: PurchaseOrderDto) {
  if (new Date(obj.delivery_date) <= new Date(obj.order_date)) {
    return false;
  }
  return true;
}
```

### Stock Validation Example

```typescript
// inventory/validators/stock-level.validator.ts
export class StockLevelValidator {
  // Ensure stock never goes below zero
  validateAdjustment(currentStock: number, adjustment: number): boolean {
    return (currentStock + adjustment) >= 0;
  }

  // Check if stock is below minimum
  isBelowMinimum(currentStock: number, minStock: number): boolean {
    return currentStock < minStock;
  }

  // Check if stock exceeds maximum
  isAboveMaximum(currentStock: number, maxStock: number): boolean {
    return currentStock > maxStock;
  }
}
```

---

## Validation Pipeline

### Global (main.ts)
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Strip unknown properties
    forbidNonWhitelisted: false,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true
    },
    skipMissingProperties: false,
    skipNullProperties: false,
    skipUndefinedProperties: false,
    validateCustomDecorators: true
  })
);
```

### DTO Level (example)
```typescript
export class CreateVendorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsEnum(['Active', 'Inactive', 'Pending'])
  status: string;

  @IsOptional()
  @IsString()
  gst_number?: string;
}
```

### Schema Level (Mongoose)
```typescript
@Prop({ required: true, unique: true })
vendor_id: string;

@Prop({ required: true })
name: string;

@Prop({ required: false })
gst_number?: string;
```

---

## Testing Credentials

### Default Admin
```
Username: admin
Password: Admin123!
Email: admin@company.com
```

### Test User Accounts
```
Doctor:    doctor_john / Doctor123! (john.doe@hospital.com)
Manager:   manager / Manager123! (manager@company.com)
Staff:     staff_user / Staff123! (staff@hospital.com)
Billing:   billing_manager / Billing123! (billing@hospital.com)
```

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] MongoDB initialized with root user
- [ ] Kafka running and healthy
- [ ] JWT_SECRET changed from default
- [ ] CORS_ORIGIN set correctly
- [ ] All schema configurations applied
- [ ] Seed data loaded (if production)
- [ ] Audit logging enabled
- [ ] Rate limiting configured
- [ ] HTTPS enabled (production)
- [ ] Database backups scheduled

---

## Architectural Requirements for Implementation (CRITICAL)

When implementing missing APIs and modules, follow these non-negotiable patterns:

### 1. **Always Use Pagination (Max 25 Items)**
- Every list endpoint returns paginated data
- Maximum limit is 25 items per page
- Use QueryParamsDto for query parameters
- Return PaginatedResponse with items, total, page, limit, totalPages, hasMore

### 2. **Referential Integrity**
- When creating records that reference other records, validate the reference exists
- Denormalize key fields (name, email, phone) for quick UI display
- Use MongoDB ref for relationship definition
- Check tenantId matches when validating references

### 3. **Enum Patterns**
- Fixed status fields: use inline schema enums (e.g. `enum: ['active', 'inactive']`)
- Tenant-customisable fields: use `custom_fields` + `fieldConfigurations` with `type: "enum"`
- System-wide enums (Role, Scope): use separate enum files in `common/enums/` or `auth/enums/`
- Match frontend enum names exactly

### 4. **Date/Time Handling**
- Auto-populate creation dates in service layer
- Auto-calculate delivery dates (orderDate + default days)
- Use ISO 8601 format (toISOString())
- Store all dates as strings in MongoDB

### 5. **Validation at Three Levels**
- **Global (main.ts)**: ValidationPipe with whitelist: true
- **DTO**: class-validator decorators (@IsString, @IsEmail, etc.)
- **Service**: Business logic validation (vendor exists, no duplicates, stock levels, etc.)

### 6. **Audit Logging**
- Log CREATE, UPDATE, DELETE operations
- Store oldValue and newValue for changes
- Include userId, tenantId, timestamp
- Use auditService.log() in all service methods

### 7. **Multi-Tenancy**
- Every query must filter by tenantId
- Every create must include tenantId
- Prevent cross-tenant data access
- Check tenantId on all references

### 8. **Error Handling**
- Return proper HTTP status codes
- Include meaningful error messages
- Throw specific exceptions (NotFoundException, BadRequestException, etc.)
- Wrap in try-catch only for unforeseeable errors

### 9. **Controller Patterns**
- Use @UseGuards(JwtAuthGuard, RolesGuard, ScopesGuard) on all endpoints
- Use @Roles() and @Scopes() decorators to restrict access
- Extract tenantId and userId from JWT token
- Include Swagger decorators (@ApiOperation, @ApiResponse, etc.)

### 10. **Event Emission (Kafka)**
- Service should emit events after successful CREATE operations
- Only emit for business-critical events (invoice generation)
- Include all necessary data in event payload
- Use consistent event structure

### 11. **Dynamic Schema Validation (custom_fields)**
- Every service.create() must validate custom_fields against tenant fieldConfigurations
- Call `tenantsService.getFieldConfiguration(tenantId, moduleKey)`
- Check required fields exist in `dto.custom_fields`
- Throw BadRequestException if required field missing
- Follow the vendor service pattern exactly (see "Module Implementation Pattern" section above)

---

## Known Issues & Gotchas

### 1. Schema Not Found Error
**Symptom**: Validation fails with "Path `name` is required" but name is in request
**Cause**: ValidationPipe whitelist removes fields without decorators
**Fix**: Add @IsString(), @IsNotEmpty() etc. to DTO properties

### 2. Tenant Not Created
**Cause**: Trying to use endpoints without creating tenant first
**Fix**: POST /tenants with admin JWT, then use tenantId in subsequent calls

### 3. Kafka Events Not Triggering Invoices
**Cause**: Event handlers not registered in module
**Fix**: Import KafkaModule in service modules, register handlers in providers

### 4. Field Mismatch Between Frontend & Backend
**Cause**: Schema not configured before creating data
**Fix**: Run `./scripts/setup-schemas.sh` BEFORE creating any records

### 5. Permission Denied on All Endpoints
**Cause**: JWT token doesn't have required scope
**Fix**: Check token scopes with `jq '.scopes'` after login

---

## Debugging Tips

### View Backend Logs
```bash
docker logs -f medsystem-backend
# Or for specific service
docker logs medsystem-backend | grep -i "invoice"
```

### Monitor Kafka Events
```bash
docker exec medsystem-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic billing-events \
  --from-beginning
```

### Check MongoDB Data
```bash
docker exec -it medsystem-mongodb mongosh
> db.vendors.find()
> db.invoices.find()
```

### Decode JWT Token
```bash
# Extract payload (second part, base64 decode)
echo "<token>" | cut -d'.' -f2 | base64 -d | jq '.'
```

---

## Performance Considerations

- **Pagination**: Always use limit/skip for large datasets (built-in via QueryDto)
- **Filtering**: Use indexed fields (tenantId, vendorId, status)
- **Aggregation**: Use MongoDB aggregation pipeline for complex reports
- **Caching**: Consider Redis for frequently accessed schemas
- **Event Processing**: Kafka ensures invoices don't block order creation

---

## Module Status & Alignment Checklist

### ✅ EXISTING Modules (schema + controller + service + dto all present)

| Module | Schema | Service | Controller | DTOs | custom_fields | tenantId | Kafka Events |
|--------|--------|---------|------------|------|---------------|----------|--------------|
| Tenants | ✅ | ✅ | ✅ | ✅ | N/A (defines them) | ✅ | — |
| Auth/Users | ✅ | ✅ | ✅ | ✅ | No | ✅ | — |
| Vendors | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Purchase Orders | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Producer |
| Sales Orders | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Producer |
| Inventory | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Doctors | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Patients | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Admissions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Producer (discharge) |
| Diagnostics | ✅ (2 schemas) | ✅ | ✅ | ✅ (4 DTOs) | No | ✅ | ✅ Producer (completion) |
| Rooms | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Medications | ✅ (2 schemas) | ✅ | ✅ | ✅ (4 DTOs) | No | ✅ | — |
| Invoices | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Consumer |
| Hospital Billing | ✅ | ✅ | ✅ | ✅ (3 DTOs) | No | ✅ | ✅ Consumer |
| Fulfillments | ✅ | ✅ | ✅ | ✅ (3 DTOs) | ✅ | **MISSING** | — |
| Quotations | ✅ | ✅ | ✅ | ✅ (3 DTOs) | ✅ | **MISSING** | — |
| Stock | ✅ (2 schemas) | ✅ | ✅ | ✅ (4 DTOs) | ✅ | ✅ | — |
| Tax | ✅ | ✅ | ✅ | ✅ (3 DTOs) | ✅ | No (global) | — |
| Audit | ✅ | ✅ | — | ✅ | — | — | — |
| Kafka | ✅ | ✅ | — | — | — | — | Infrastructure |

### ⏳ Alignment Tasks (modules exist but need updates)

- [ ] **Fulfillments** — Add `tenantId` to fulfillment.schema.ts (CRITICAL: no tenant isolation)
- [ ] **Quotations** — Add `tenantId` to quotation.schema.ts (CRITICAL: no tenant isolation)
- [ ] **Diagnostics** — Consider adding `custom_fields` to both schemas for tenant flexibility
- [ ] **Medications** — Consider adding `custom_fields` to medication.schema.ts
- [ ] **Hospital Billing** — Consider adding `custom_fields` to hospital-bill.schema.ts
- [ ] **Auth/Users** — Extend User schema with email, first_name, last_name, scopes[], status, phone for Settings page
- [ ] **All modules** — Verify each service validates custom_fields against tenant fieldConfigurations (vendor pattern)
- [ ] **All modules** — Verify each service uses auditService.log() for all CRUD operations
- [ ] **All modules** — Verify pagination max 25 items enforced in all list endpoints

### 🔲 TODO — New modules/features to create

- [ ] **Discounts module** — discount.schema.ts, service, controller (percentage/flat, min_order_value)
- [ ] **Addresses module** — address.schema.ts, service, controller (shipping/billing addresses)
- [ ] **Lookup endpoints** — Add `/lookup` routes to all entity controllers for auto-suggest dropdowns
- [ ] **Schema config JSONs** — Create JSON files for modules missing from schema-configs/ (rooms, medications, admissions, stock, fulfillments, quotations)

### Implementation Priority
1. **CRITICAL**: Fix tenantId on Fulfillments & Quotations (data isolation breach)
2. **HIGH**: Extend User schema for Settings page
3. **MEDIUM**: Add custom_fields to Diagnostics, Medications, Hospital Billing
4. **MEDIUM**: Add lookup endpoints to all modules
5. **LOW**: Create Discounts and Addresses modules

**Important**: All implementations MUST follow the vendor module pattern documented above.

---

## Related Documentation

- **ARCHITECTURE_OVERVIEW.md** - System-wide architecture
- **SCHEMA_CONFIGURATION_GUIDE.md** - Detailed field mappings for all 8 modules
- **SCHEMA_SETUP_README.md** - Schema setup instructions
- **RBAC_ROLES_AND_SCOPES.md** - Complete role/scope definitions
- **docker-compose.yml** - Container configuration
- **Frontend CLAUDE.md** - Frontend type definitions and patterns

---

## Quick Command Reference

```bash
# Development
npm install
npm run start:dev

# Database
npm run seed:standalone    # Seed all data
npm run seed:inventory     # Just inventory

# Schemas
./scripts/setup-schemas.sh # Configure all 8 modules

# Testing
npm test
npm run test:e2e

# API
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}'

# Docker
docker-compose up -d       # Start all services
docker-compose down        # Stop all services
docker logs -f <container>
```

---

**Last Updated**: 2026-05-24  
**Backend Version**: Production  
**Database**: MongoDB 7.0  
**Event System**: Kafka 7.6.0  

When working on this project, refer to this file for context and architecture decisions. All major patterns and file locations are documented here.
