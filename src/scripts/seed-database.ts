import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Role, RoleDocument } from '../auth/schemas/role.schema';
import { Tax, TaxDocument } from '../tax/schemas/tax.schema';
import { Room, RoomDocument } from '../rooms/schemas/room.schema';
import { Doctor, DoctorDocument } from '../doctors/schemas/doctor.schema';
import { Medication, MedicationDocument } from '../medications/schemas/medication.schema';
import { Vendor, VendorDocument } from '../vendors/schemas/vendor.schema';
import { Patient, PatientDocument } from '../patients/schemas/patient.schema';
import { InventoryItem, InventoryItemDocument } from '../inventory/schemas/inventory-item.schema';
import { Admission, AdmissionDocument } from '../admissions/schemas/admission.schema';
import { PurchaseOrder, PurchaseOrderDocument } from '../purchase-orders/schemas/purchase-order.schema';
import { SalesOrder, SalesOrderDocument } from '../sales-orders/schemas/sales-order.schema';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import { Role as RoleEnum, Scope } from '../common/enums';
import * as bcrypt from 'bcrypt';

interface AdminUserConfig {
  username: string;
  password: string;
  roles: string[];
  tenantId: string;
}

interface RoleConfig {
  name: string;
  scopes: string[];
}

interface TaxConfig {
  tax_code: string;
  name: string;
  description: string;
  rate: number;
  rate_type: 'percentage' | 'fixed';
  applicable_on: 'sales' | 'purchase' | 'both';
  status: 'active' | 'inactive' | 'archived';
  jurisdiction?: string;
  tax_category?: string;
  priority?: number;
  is_inclusive?: boolean;
  is_compound?: boolean;
  components?: Array<{
    name: string;
    rate: number;
    description?: string;
  }>;
  configuration?: {
    min_amount?: number;
    max_amount?: number;
    exempt_threshold?: number;
    reverse_charge?: boolean;
  };
}

class DatabaseSeeder {
  private userModel: Model<UserDocument>;
  private roleModel: Model<RoleDocument>;
  private taxModel: Model<TaxDocument>;
  private roomModel: Model<RoomDocument>;
  private doctorModel: Model<DoctorDocument>;
  private medicationModel: Model<MedicationDocument>;
  private vendorModel: Model<VendorDocument>;
  private patientModel: Model<PatientDocument>;
  private inventoryModel: Model<InventoryItemDocument>;
  private admissionModel: Model<AdmissionDocument>;
  private purchaseOrderModel: Model<PurchaseOrderDocument>;
  private salesOrderModel: Model<SalesOrderDocument>;
  private tenantModel: Model<TenantDocument>;

  private readonly DEFAULT_TENANT_ID = 'default_tenant';

  // Default roles configuration
  private readonly defaultRoles: RoleConfig[] = [
    {
      name: RoleEnum.ADMIN,
      scopes: [
        // All module permissions for admin
        Scope.TENANTS,
        Scope.VENDORS,
        Scope.INVOICES,
        Scope.PURCHASE_ORDERS,
        Scope.SALES_ORDERS,
        Scope.USER_MANAGEMENT,
        Scope.SYSTEM_ADMIN,
      ],
    },
    {
      name: RoleEnum.MANAGER,
      scopes: [
        // Business modules access for managers
        Scope.TENANTS,
        Scope.VENDORS,
        Scope.INVOICES,
        Scope.PURCHASE_ORDERS,
        Scope.SALES_ORDERS,
      ],
    },
    {
      name: RoleEnum.USER,
      scopes: [
        // Limited module access for regular users
        Scope.VENDORS,
        Scope.INVOICES,
        Scope.PURCHASE_ORDERS,
        Scope.SALES_ORDERS,
      ],
    },
    {
      name: RoleEnum.VIEWER,
      scopes: [
        // Read-only access to basic modules
        Scope.VENDORS,
        Scope.INVOICES,
        Scope.PURCHASE_ORDERS,
        Scope.SALES_ORDERS,
      ],
    },
  ];

  // Default admin users configuration
  private readonly defaultAdminUsers: AdminUserConfig[] = [
    {
      username: 'admin@company.com',
      password: 'Admin123!',
      roles: [RoleEnum.ADMIN],
      tenantId: 'default_tenant',
    },
    {
      username: 'manager@company.com',
      password: 'Manager123!',
      roles: [RoleEnum.MANAGER],
      tenantId: 'default_tenant',
    },
  ];

  // Default tax configurations
  private readonly defaultTaxes: TaxConfig[] = [
    // GST Taxes (India)
    {
      tax_code: 'GST-5',
      name: 'GST 5%',
      description: 'Goods and Services Tax at 5% rate',
      rate: 5,
      rate_type: 'percentage',
      applicable_on: 'both',
      status: 'active',
      jurisdiction: 'India',
      tax_category: 'GST',
      priority: 1,
      is_inclusive: false,
      is_compound: false,
    },
    {
      tax_code: 'GST-12',
      name: 'GST 12%',
      description: 'Goods and Services Tax at 12% rate',
      rate: 12,
      rate_type: 'percentage',
      applicable_on: 'both',
      status: 'active',
      jurisdiction: 'India',
      tax_category: 'GST',
      priority: 1,
      is_inclusive: false,
      is_compound: false,
    },
    {
      tax_code: 'GST-18',
      name: 'GST 18%',
      description: 'Goods and Services Tax at 18% rate',
      rate: 18,
      rate_type: 'percentage',
      applicable_on: 'both',
      status: 'active',
      jurisdiction: 'India',
      tax_category: 'GST',
      priority: 1,
      is_inclusive: false,
      is_compound: false,
    },
    {
      tax_code: 'GST-28',
      name: 'GST 28%',
      description: 'Goods and Services Tax at 28% rate (Luxury goods)',
      rate: 28,
      rate_type: 'percentage',
      applicable_on: 'both',
      status: 'active',
      jurisdiction: 'India',
      tax_category: 'GST',
      priority: 1,
      is_inclusive: false,
      is_compound: false,
    },
    // Compound GST (CGST + SGST)
    {
      tax_code: 'GST-18-COMPOUND',
      name: 'GST 18% (CGST 9% + SGST 9%)',
      description: 'Compound GST with Central and State components',
      rate: 18,
      rate_type: 'percentage',
      applicable_on: 'both',
      status: 'active',
      jurisdiction: 'India',
      tax_category: 'GST',
      priority: 1,
      is_inclusive: false,
      is_compound: false,
      components: [
        { name: 'CGST', rate: 9, description: 'Central GST' },
        { name: 'SGST', rate: 9, description: 'State GST' },
      ],
    },
    {
      tax_code: 'GST-12-COMPOUND',
      name: 'GST 12% (CGST 6% + SGST 6%)',
      description: 'Compound GST with Central and State components',
      rate: 12,
      rate_type: 'percentage',
      applicable_on: 'both',
      status: 'active',
      jurisdiction: 'India',
      tax_category: 'GST',
      priority: 1,
      is_inclusive: false,
      is_compound: false,
      components: [
        { name: 'CGST', rate: 6, description: 'Central GST' },
        { name: 'SGST', rate: 6, description: 'State GST' },
      ],
    },
    // IGST (Inter-state GST)
    {
      tax_code: 'IGST-18',
      name: 'IGST 18%',
      description: 'Integrated GST for inter-state transactions',
      rate: 18,
      rate_type: 'percentage',
      applicable_on: 'both',
      status: 'active',
      jurisdiction: 'India',
      tax_category: 'IGST',
      priority: 1,
      is_inclusive: false,
      is_compound: false,
    },
    // VAT Taxes
    {
      tax_code: 'VAT-20',
      name: 'VAT 20%',
      description: 'Value Added Tax at standard rate',
      rate: 20,
      rate_type: 'percentage',
      applicable_on: 'both',
      status: 'active',
      jurisdiction: 'UK',
      tax_category: 'VAT',
      priority: 1,
      is_inclusive: false,
      is_compound: false,
    },
    {
      tax_code: 'VAT-5',
      name: 'VAT 5%',
      description: 'Value Added Tax at reduced rate',
      rate: 5,
      rate_type: 'percentage',
      applicable_on: 'both',
      status: 'active',
      jurisdiction: 'UK',
      tax_category: 'VAT',
      priority: 1,
      is_inclusive: false,
      is_compound: false,
    },
    {
      tax_code: 'VAT-0',
      name: 'VAT 0% (Zero-rated)',
      description: 'Zero-rated VAT for specific goods',
      rate: 0,
      rate_type: 'percentage',
      applicable_on: 'both',
      status: 'active',
      jurisdiction: 'UK',
      tax_category: 'VAT',
      priority: 1,
      is_inclusive: false,
      is_compound: false,
    },
    // Sales Tax (US)
    {
      tax_code: 'SALES-TAX-7',
      name: 'Sales Tax 7%',
      description: 'State sales tax',
      rate: 7,
      rate_type: 'percentage',
      applicable_on: 'sales',
      status: 'active',
      jurisdiction: 'USA',
      tax_category: 'Sales Tax',
      priority: 1,
      is_inclusive: false,
      is_compound: false,
    },
    {
      tax_code: 'SALES-TAX-10',
      name: 'Sales Tax 10%',
      description: 'Combined state and local sales tax',
      rate: 10,
      rate_type: 'percentage',
      applicable_on: 'sales',
      status: 'active',
      jurisdiction: 'USA',
      tax_category: 'Sales Tax',
      priority: 1,
      is_inclusive: false,
      is_compound: false,
    },
    // Service Tax
    {
      tax_code: 'SERVICE-TAX-15',
      name: 'Service Tax 15%',
      description: 'Tax applicable on services',
      rate: 15,
      rate_type: 'percentage',
      applicable_on: 'both',
      status: 'active',
      tax_category: 'Service Tax',
      priority: 2,
      is_inclusive: false,
      is_compound: false,
    },
    // Fixed Tax
    {
      tax_code: 'ENV-TAX-FIXED',
      name: 'Environmental Tax',
      description: 'Fixed environmental tax per transaction',
      rate: 5,
      rate_type: 'fixed',
      applicable_on: 'both',
      status: 'active',
      tax_category: 'Environmental Tax',
      priority: 3,
      is_inclusive: false,
      is_compound: false,
      configuration: {
        min_amount: 0,
        max_amount: 100,
      },
    },
    // Tax with threshold
    {
      tax_code: 'LUXURY-TAX-10',
      name: 'Luxury Tax 10%',
      description: 'Tax for luxury items above threshold',
      rate: 10,
      rate_type: 'percentage',
      applicable_on: 'sales',
      status: 'active',
      tax_category: 'Luxury Tax',
      priority: 2,
      is_inclusive: false,
      is_compound: false,
      configuration: {
        exempt_threshold: 1000,
      },
    },
  ];

  constructor(
    userModel: Model<UserDocument>,
    roleModel: Model<RoleDocument>,
    taxModel: Model<TaxDocument>,
    roomModel: Model<RoomDocument>,
    doctorModel: Model<DoctorDocument>,
    medicationModel: Model<MedicationDocument>,
    vendorModel: Model<VendorDocument>,
    patientModel: Model<PatientDocument>,
    inventoryModel: Model<InventoryItemDocument>,
    admissionModel: Model<AdmissionDocument>,
    purchaseOrderModel: Model<PurchaseOrderDocument>,
    salesOrderModel: Model<SalesOrderDocument>,
    tenantModel: Model<TenantDocument>,
  ) {
    this.userModel = userModel;
    this.roleModel = roleModel;
    this.taxModel = taxModel;
    this.roomModel = roomModel;
    this.doctorModel = doctorModel;
    this.medicationModel = medicationModel;
    this.vendorModel = vendorModel;
    this.patientModel = patientModel;
    this.inventoryModel = inventoryModel;
    this.admissionModel = admissionModel;
    this.purchaseOrderModel = purchaseOrderModel;
    this.salesOrderModel = salesOrderModel;
    this.tenantModel = tenantModel;
  }

  async seedRoles(): Promise<void> {
    console.log('🔄 Seeding roles...');

    for (const roleConfig of this.defaultRoles) {
      const existingRole = await this.roleModel.findOne({
        name: roleConfig.name,
      });

      if (existingRole) {
        console.log(
          `   ⚠️  Role '${roleConfig.name}' already exists, updating scopes...`,
        );
        existingRole.scopes = roleConfig.scopes;
        existingRole.updatedBy = 'system';
        await existingRole.save();
      } else {
        console.log(`   ✅ Creating role '${roleConfig.name}'...`);
        await this.roleModel.create({
          name: roleConfig.name,
          scopes: roleConfig.scopes,
          createdBy: 'system',
          updatedBy: 'system',
        });
      }
    }

    console.log('✅ Roles seeded successfully!');
  }

  async seedAdminUsers(): Promise<void> {
    console.log('🔄 Seeding admin users...');

    for (const userConfig of this.defaultAdminUsers) {
      const existingUser = await this.userModel.findOne({
        username: userConfig.username,
      });

      if (existingUser) {
        console.log(
          `   ⚠️  User '${userConfig.username}' already exists, skipping...`,
        );
        continue;
      }

      console.log(`   ✅ Creating user '${userConfig.username}'...`);

      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userConfig.password, saltRounds);

      // Create the user
      await this.userModel.create({
        username: userConfig.username,
        password_hash: hashedPassword,
        roles: userConfig.roles,
        tenantId: userConfig.tenantId,
        createdBy: 'system',
        updatedBy: 'system',
      });

      console.log(
        `   🔐 User '${userConfig.username}' created with hashed password`,
      );
    }

    console.log('✅ Admin users seeded successfully!');
  }

  async createCustomUser(
    username: string,
    password: string,
    roles: string[],
    tenantId: string = 'default_tenant',
  ): Promise<void> {
    console.log(`🔄 Creating custom user '${username}'...`);

    const existingUser = await this.userModel.findOne({ username });
    if (existingUser) {
      throw new Error(`User '${username}' already exists`);
    }

    // Validate roles exist
    for (const roleName of roles) {
      const role = await this.roleModel.findOne({ name: roleName });
      if (!role) {
        throw new Error(
          `Role '${roleName}' does not exist. Please create roles first.`,
        );
      }
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create the user
      await this.userModel.create({
        username,
        password_hash: hashedPassword,
        roles,
        tenantId,
        createdBy: 'system',
        updatedBy: 'system',
      });

    console.log(`✅ Custom user '${username}' created successfully!`);
  }

  async listUsers(): Promise<void> {
    console.log('📋 Current users in database:');
    const users = await this.userModel.find({}, { password_hash: 0 }).lean();

    if (users.length === 0) {
      console.log('   No users found in database');
      return;
    }

    users.forEach((user) => {
      console.log(`   👤 ${user.username} - Tenant: ${user.tenantId || 'N/A'} - Roles: [${user.roles.join(', ')}]`);
    });
  }

  async listRoles(): Promise<void> {
    console.log('📋 Current roles in database:');
    const roles = await this.roleModel.find({}).lean();

    if (roles.length === 0) {
      console.log('   No roles found in database');
      return;
    }

    roles.forEach((role) => {
      console.log(
        `   🎭 ${role.name} - Scopes: ${role.scopes.length} permissions`,
      );
    });
  }

  async seedTaxes(): Promise<void> {
    console.log('🔄 Seeding taxes...');

    for (const taxConfig of this.defaultTaxes) {
      const existingTax = await this.taxModel.findOne({
        tax_code: taxConfig.tax_code,
      });

      if (existingTax) {
        console.log(
          `   ⚠️  Tax '${taxConfig.tax_code}' already exists, updating...`,
        );
        Object.assign(existingTax, taxConfig);
        existingTax.updatedBy = 'system';
        await existingTax.save();
      } else {
        console.log(`   ✅ Creating tax '${taxConfig.tax_code}'...`);
        await this.taxModel.create({
          ...taxConfig,
          createdBy: 'system',
          updatedBy: 'system',
        });
      }
    }

    console.log('✅ Taxes seeded successfully!');
  }

  async listTaxes(): Promise<void> {
    console.log('📋 Current taxes in database:');
    const taxes = await this.taxModel.find({}).lean();

    if (taxes.length === 0) {
      console.log('   No taxes found in database');
      return;
    }

    console.log(`   Found ${taxes.length} taxes:`);
    taxes.forEach((tax) => {
      const components = tax.components?.length
        ? ` (${tax.components.map((c) => c.name).join(' + ')})`
        : '';
      console.log(
        `   💰 ${tax.tax_code} - ${tax.name} [${tax.rate}${tax.rate_type === 'percentage' ? '%' : ' fixed'}]${components} - ${tax.status}`,
      );
    });
  }

  // ---------------------------------------------------------------------------
  // Rooms
  // ---------------------------------------------------------------------------

  async seedRooms(): Promise<void> {
    console.log('🔄 Seeding rooms...');

    const tenantId = this.DEFAULT_TENANT_ID;

    const rooms: Array<{
      room_number: string;
      floor: number;
      type: string;
      status: string;
      bed_capacity: number;
      daily_rate: number;
      amenities: string[];
      department: string;
      tenantId: string;
    }> = [
      // General ward — G101-G110
      ...Array.from({ length: 10 }, (_, i) => ({
        room_number: `G${101 + i}`,
        floor: i < 5 ? 1 : 2,
        type: 'general',
        status: 'available',
        bed_capacity: 4,
        daily_rate: 1500,
        amenities: ['Call Bell', 'Fan'],
        department: 'General Medicine',
        tenantId,
      })),

      // Semi-Private — S201-S206
      ...[
        { room_number: 'S201', department: 'General Medicine' },
        { room_number: 'S202', department: 'Orthopaedics' },
        { room_number: 'S203', department: 'Cardiology' },
        { room_number: 'S204', department: 'Gynaecology' },
        { room_number: 'S205', department: 'Paediatrics' },
        { room_number: 'S206', department: 'ENT' },
      ].map((r) => ({
        ...r,
        floor: 2,
        type: 'semi_private',
        status: 'available',
        bed_capacity: 2,
        daily_rate: 3000,
        amenities: ['AC', 'TV', 'Call Bell'],
        tenantId,
      })),

      // Private — P301-P306
      ...[
        { room_number: 'P301', department: 'Cardiology' },
        { room_number: 'P302', department: 'Orthopaedics' },
        { room_number: 'P303', department: 'Neurology' },
        { room_number: 'P304', department: 'Oncology' },
        { room_number: 'P305', department: 'General Medicine' },
        { room_number: 'P306', department: 'Gynaecology' },
      ].map((r) => ({
        ...r,
        floor: 3,
        type: 'private',
        status: 'available',
        bed_capacity: 1,
        daily_rate: 5000,
        amenities: ['AC', 'TV', 'Attached Bath', 'Wi-Fi'],
        tenantId,
      })),

      // ICU — I401-I404
      ...Array.from({ length: 4 }, (_, i) => ({
        room_number: `I${401 + i}`,
        floor: 4,
        type: 'icu',
        status: 'available',
        bed_capacity: 1,
        daily_rate: 12000,
        amenities: ['Ventilator Support', 'Cardiac Monitor'],
        department: 'Emergency',
        tenantId,
      })),

      // Deluxe — D305-D306
      ...[
        { room_number: 'D305', department: 'Cardiology' },
        { room_number: 'D306', department: 'Orthopaedics' },
      ].map((r) => ({
        ...r,
        floor: 3,
        type: 'deluxe',
        status: 'available',
        bed_capacity: 1,
        daily_rate: 8000,
        amenities: ['AC', 'TV', 'Attached Bath', 'Wi-Fi', 'Sofa'],
        tenantId,
      })),

      // Suite — T401-T402
      ...[
        { room_number: 'T401', department: 'General Medicine' },
        { room_number: 'T402', department: 'Cardiology' },
      ].map((r) => ({
        ...r,
        floor: 4,
        type: 'suite',
        status: 'available',
        bed_capacity: 1,
        daily_rate: 15000,
        amenities: ['AC', 'TV', 'Attached Bath', 'Wi-Fi', 'Sofa', 'Kitchenette'],
        tenantId,
      })),
    ];

    for (const room of rooms) {
      await this.roomModel.findOneAndUpdate(
        { tenantId: room.tenantId, room_number: room.room_number },
        { $set: room },
        { upsert: true, new: true },
      );
      console.log(`   ✅ Upserted room ${room.room_number} (${room.type})`);
    }

    console.log(`✅ Rooms seeded successfully! (${rooms.length} rooms)`);
  }

  // ---------------------------------------------------------------------------
  // Doctors
  // ---------------------------------------------------------------------------

  async seedDoctors(): Promise<void> {
    console.log('🔄 Seeding doctors...');

    const tenantId = this.DEFAULT_TENANT_ID;

    const weekdaySchedule = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(
      (day) => ({ day, start_time: '09:00', end_time: '17:00' }),
    );

    const doctors: Array<{
      employee_id: string;
      name: string;
      gender: string;
      department: string;
      specialisation: string;
      qualification: string[];
      experience_years: number;
      consultation_fee: number;
      opd_slots_per_day: number;
      status: string;
      registration_no: string;
      schedule: { day: string; start_time: string; end_time: string }[];
      tenantId: string;
    }> = [
      {
        employee_id: 'DR-001',
        name: 'Dr. Priya Sharma',
        gender: 'Female',
        department: 'Cardiology',
        specialisation: 'Interventional Cardiology',
        qualification: ['MBBS', 'MD Cardiology'],
        experience_years: 15,
        consultation_fee: 800,
        opd_slots_per_day: 20,
        status: 'active',
        registration_no: 'MCI-2009-0001',
        schedule: weekdaySchedule,
        tenantId,
      },
      {
        employee_id: 'DR-002',
        name: 'Dr. Arjun Mehta',
        gender: 'Male',
        department: 'Orthopaedics',
        specialisation: 'Joint Replacement Surgery',
        qualification: ['MBBS', 'MS Orthopaedics'],
        experience_years: 10,
        consultation_fee: 700,
        opd_slots_per_day: 18,
        status: 'active',
        registration_no: 'MCI-2014-0002',
        schedule: weekdaySchedule,
        tenantId,
      },
      {
        employee_id: 'DR-003',
        name: 'Dr. Lakshmi Nair',
        gender: 'Female',
        department: 'Neurology',
        specialisation: 'Stroke & Epilepsy',
        qualification: ['MBBS', 'DM Neurology'],
        experience_years: 12,
        consultation_fee: 900,
        opd_slots_per_day: 15,
        status: 'active',
        registration_no: 'MCI-2012-0003',
        schedule: weekdaySchedule,
        tenantId,
      },
      {
        employee_id: 'DR-004',
        name: 'Dr. Rahul Gupta',
        gender: 'Male',
        department: 'General Medicine',
        specialisation: 'Internal Medicine',
        qualification: ['MBBS', 'MD General Medicine'],
        experience_years: 8,
        consultation_fee: 500,
        opd_slots_per_day: 25,
        status: 'active',
        registration_no: 'MCI-2016-0004',
        schedule: weekdaySchedule,
        tenantId,
      },
      {
        employee_id: 'DR-005',
        name: 'Dr. Pooja Iyer',
        gender: 'Female',
        department: 'Paediatrics',
        specialisation: 'Neonatology',
        qualification: ['MBBS', 'MD Paediatrics'],
        experience_years: 7,
        consultation_fee: 600,
        opd_slots_per_day: 20,
        status: 'active',
        registration_no: 'MCI-2017-0005',
        schedule: weekdaySchedule,
        tenantId,
      },
      {
        employee_id: 'DR-006',
        name: 'Dr. Vikram Singh',
        gender: 'Male',
        department: 'Oncology',
        specialisation: 'Medical Oncology',
        qualification: ['MBBS', 'DM Medical Oncology'],
        experience_years: 14,
        consultation_fee: 1000,
        opd_slots_per_day: 12,
        status: 'active',
        registration_no: 'MCI-2010-0006',
        schedule: weekdaySchedule,
        tenantId,
      },
      {
        employee_id: 'DR-007',
        name: 'Dr. Meera Krishnan',
        gender: 'Female',
        department: 'Emergency',
        specialisation: 'Emergency Medicine',
        qualification: ['MBBS', 'MD Emergency Medicine'],
        experience_years: 6,
        consultation_fee: 500,
        opd_slots_per_day: 30,
        status: 'active',
        registration_no: 'MCI-2018-0007',
        schedule: weekdaySchedule,
        tenantId,
      },
      {
        employee_id: 'DR-008',
        name: 'Dr. Amit Joshi',
        gender: 'Male',
        department: 'Radiology',
        specialisation: 'Diagnostic Radiology',
        qualification: ['MBBS', 'MD Radiology'],
        experience_years: 9,
        consultation_fee: 600,
        opd_slots_per_day: 20,
        status: 'active',
        registration_no: 'MCI-2015-0008',
        schedule: weekdaySchedule,
        tenantId,
      },
      {
        employee_id: 'DR-009',
        name: 'Dr. Suman Rao',
        gender: 'Female',
        department: 'Gynaecology',
        specialisation: 'Obstetrics & Gynaecology',
        qualification: ['MBBS', 'MS Gynaecology'],
        experience_years: 11,
        consultation_fee: 700,
        opd_slots_per_day: 18,
        status: 'active',
        registration_no: 'MCI-2013-0009',
        schedule: weekdaySchedule,
        tenantId,
      },
      {
        employee_id: 'DR-010',
        name: 'Dr. Rajan Patel',
        gender: 'Male',
        department: 'ENT',
        specialisation: 'Otolaryngology',
        qualification: ['MBBS', 'MS ENT'],
        experience_years: 5,
        consultation_fee: 500,
        opd_slots_per_day: 20,
        status: 'active',
        registration_no: 'MCI-2019-0010',
        schedule: weekdaySchedule,
        tenantId,
      },
    ];

    for (const doctor of doctors) {
      await this.doctorModel.findOneAndUpdate(
        { tenantId: doctor.tenantId, employee_id: doctor.employee_id },
        { $set: doctor },
        { upsert: true, new: true },
      );
      console.log(`   ✅ Upserted doctor ${doctor.employee_id} - ${doctor.name}`);
    }

    console.log(`✅ Doctors seeded successfully! (${doctors.length} doctors)`);
  }

  // ---------------------------------------------------------------------------
  // Medications
  // ---------------------------------------------------------------------------

  async seedMedications(): Promise<void> {
    console.log('🔄 Seeding medications...');

    const tenantId = this.DEFAULT_TENANT_ID;

    const medications: Array<{
      drug_code: string;
      name: string;
      generic_name: string;
      dosage_form: string;
      strength: string;
      price_per_unit: number;
      stock_quantity: number;
      manufacturer: string;
      category: string;
      is_active: boolean;
      tenantId: string;
    }> = [
      // Analgesics / Antipyretics
      { drug_code: 'MED-001', name: 'Paracetamol IP 500mg', generic_name: 'Paracetamol', dosage_form: 'tablet', strength: '500mg', price_per_unit: 1.5, stock_quantity: 500, manufacturer: 'Cipla', category: 'Analgesic/Antipyretic', is_active: true, tenantId },
      { drug_code: 'MED-002', name: 'Ibuprofen IP 400mg', generic_name: 'Ibuprofen', dosage_form: 'tablet', strength: '400mg', price_per_unit: 3.0, stock_quantity: 400, manufacturer: 'Sun Pharma', category: 'Analgesic/Anti-inflammatory', is_active: true, tenantId },
      { drug_code: 'MED-003', name: 'Aspirin BP 75mg', generic_name: 'Aspirin', dosage_form: 'tablet', strength: '75mg', price_per_unit: 1.0, stock_quantity: 300, manufacturer: 'Pfizer', category: 'Analgesic/Antipyretic', is_active: true, tenantId },
      { drug_code: 'MED-004', name: 'Diclofenac Sodium 50mg', generic_name: 'Diclofenac Sodium', dosage_form: 'tablet', strength: '50mg', price_per_unit: 4.0, stock_quantity: 300, manufacturer: 'Novartis', category: 'Analgesic/Anti-inflammatory', is_active: true, tenantId },

      // Antibiotics
      { drug_code: 'MED-005', name: 'Amoxicillin IP 500mg', generic_name: 'Amoxicillin', dosage_form: 'capsule', strength: '500mg', price_per_unit: 8.0, stock_quantity: 400, manufacturer: 'Cipla', category: 'Antibiotic', is_active: true, tenantId },
      { drug_code: 'MED-006', name: 'Azithromycin IP 500mg', generic_name: 'Azithromycin', dosage_form: 'tablet', strength: '500mg', price_per_unit: 25.0, stock_quantity: 200, manufacturer: 'Sun Pharma', category: 'Antibiotic', is_active: true, tenantId },
      { drug_code: 'MED-007', name: 'Ciprofloxacin IP 500mg', generic_name: 'Ciprofloxacin', dosage_form: 'tablet', strength: '500mg', price_per_unit: 10.0, stock_quantity: 300, manufacturer: 'Dr. Reddy\'s', category: 'Antibiotic', is_active: true, tenantId },
      { drug_code: 'MED-008', name: 'Cephalexin IP 500mg', generic_name: 'Cephalexin', dosage_form: 'capsule', strength: '500mg', price_per_unit: 12.0, stock_quantity: 250, manufacturer: 'Lupin', category: 'Antibiotic', is_active: true, tenantId },
      { drug_code: 'MED-009', name: 'Doxycycline IP 100mg', generic_name: 'Doxycycline', dosage_form: 'capsule', strength: '100mg', price_per_unit: 7.0, stock_quantity: 200, manufacturer: 'Pfizer', category: 'Antibiotic', is_active: true, tenantId },
      { drug_code: 'MED-010', name: 'Metronidazole IP 400mg', generic_name: 'Metronidazole', dosage_form: 'tablet', strength: '400mg', price_per_unit: 3.5, stock_quantity: 300, manufacturer: 'Cipla', category: 'Antibiotic', is_active: true, tenantId },

      // Antacids / GI
      { drug_code: 'MED-011', name: 'Omeprazole IP 20mg', generic_name: 'Omeprazole', dosage_form: 'capsule', strength: '20mg', price_per_unit: 6.0, stock_quantity: 400, manufacturer: 'Sun Pharma', category: 'Antacid/GI', is_active: true, tenantId },
      { drug_code: 'MED-012', name: 'Pantoprazole IP 40mg', generic_name: 'Pantoprazole', dosage_form: 'tablet', strength: '40mg', price_per_unit: 8.0, stock_quantity: 350, manufacturer: 'Dr. Reddy\'s', category: 'Antacid/GI', is_active: true, tenantId },
      { drug_code: 'MED-013', name: 'Ranitidine IP 150mg', generic_name: 'Ranitidine', dosage_form: 'tablet', strength: '150mg', price_per_unit: 3.0, stock_quantity: 250, manufacturer: 'Cipla', category: 'Antacid/GI', is_active: true, tenantId },
      { drug_code: 'MED-014', name: 'Domperidone IP 10mg', generic_name: 'Domperidone', dosage_form: 'tablet', strength: '10mg', price_per_unit: 4.0, stock_quantity: 300, manufacturer: 'Lupin', category: 'Antacid/GI', is_active: true, tenantId },
      { drug_code: 'MED-015', name: 'Ondansetron IP 4mg', generic_name: 'Ondansetron', dosage_form: 'tablet', strength: '4mg', price_per_unit: 10.0, stock_quantity: 200, manufacturer: 'Sun Pharma', category: 'Antacid/GI', is_active: true, tenantId },

      // Cardiac / BP
      { drug_code: 'MED-016', name: 'Amlodipine IP 5mg', generic_name: 'Amlodipine', dosage_form: 'tablet', strength: '5mg', price_per_unit: 5.0, stock_quantity: 400, manufacturer: 'Pfizer', category: 'Cardiac/Antihypertensive', is_active: true, tenantId },
      { drug_code: 'MED-017', name: 'Atenolol IP 50mg', generic_name: 'Atenolol', dosage_form: 'tablet', strength: '50mg', price_per_unit: 3.0, stock_quantity: 350, manufacturer: 'Cipla', category: 'Cardiac/Antihypertensive', is_active: true, tenantId },
      { drug_code: 'MED-018', name: 'Metoprolol Tartrate 25mg', generic_name: 'Metoprolol', dosage_form: 'tablet', strength: '25mg', price_per_unit: 5.0, stock_quantity: 300, manufacturer: 'Sun Pharma', category: 'Cardiac/Antihypertensive', is_active: true, tenantId },
      { drug_code: 'MED-019', name: 'Enalapril Maleate 5mg', generic_name: 'Enalapril', dosage_form: 'tablet', strength: '5mg', price_per_unit: 4.0, stock_quantity: 300, manufacturer: 'Novartis', category: 'Cardiac/Antihypertensive', is_active: true, tenantId },
      { drug_code: 'MED-020', name: 'Losartan Potassium 50mg', generic_name: 'Losartan', dosage_form: 'tablet', strength: '50mg', price_per_unit: 8.0, stock_quantity: 250, manufacturer: 'Lupin', category: 'Cardiac/Antihypertensive', is_active: true, tenantId },
      { drug_code: 'MED-021', name: 'Aspirin IP 150mg', generic_name: 'Aspirin', dosage_form: 'tablet', strength: '150mg', price_per_unit: 2.0, stock_quantity: 400, manufacturer: 'Cipla', category: 'Cardiac/Antihypertensive', is_active: true, tenantId },

      // Diabetes
      { drug_code: 'MED-022', name: 'Metformin HCl 500mg', generic_name: 'Metformin', dosage_form: 'tablet', strength: '500mg', price_per_unit: 3.0, stock_quantity: 500, manufacturer: 'Sun Pharma', category: 'Antidiabetic', is_active: true, tenantId },
      { drug_code: 'MED-023', name: 'Glimepiride IP 1mg', generic_name: 'Glimepiride', dosage_form: 'tablet', strength: '1mg', price_per_unit: 6.0, stock_quantity: 300, manufacturer: 'Dr. Reddy\'s', category: 'Antidiabetic', is_active: true, tenantId },
      { drug_code: 'MED-024', name: 'Glibenclamide IP 5mg', generic_name: 'Glibenclamide', dosage_form: 'tablet', strength: '5mg', price_per_unit: 2.5, stock_quantity: 300, manufacturer: 'Cipla', category: 'Antidiabetic', is_active: true, tenantId },
      { drug_code: 'MED-025', name: 'Insulin Regular 100IU/ml', generic_name: 'Insulin Regular', dosage_form: 'injection', strength: '100IU/ml', price_per_unit: 180.0, stock_quantity: 100, manufacturer: 'Novo Nordisk', category: 'Antidiabetic', is_active: true, tenantId },

      // Vitamins
      { drug_code: 'MED-026', name: 'Vitamin D3 60000IU', generic_name: 'Cholecalciferol', dosage_form: 'capsule', strength: '60000IU', price_per_unit: 25.0, stock_quantity: 200, manufacturer: 'Sun Pharma', category: 'Vitamin/Supplement', is_active: true, tenantId },
      { drug_code: 'MED-027', name: 'Vitamin B12 1500mcg', generic_name: 'Cyanocobalamin', dosage_form: 'tablet', strength: '1500mcg', price_per_unit: 12.0, stock_quantity: 200, manufacturer: 'Cipla', category: 'Vitamin/Supplement', is_active: true, tenantId },
      { drug_code: 'MED-028', name: 'Folic Acid IP 5mg', generic_name: 'Folic Acid', dosage_form: 'tablet', strength: '5mg', price_per_unit: 2.0, stock_quantity: 300, manufacturer: 'Lupin', category: 'Vitamin/Supplement', is_active: true, tenantId },
      { drug_code: 'MED-029', name: 'Calcium + D3 Tablet', generic_name: 'Calcium Carbonate + Cholecalciferol', dosage_form: 'tablet', strength: '500mg+250IU', price_per_unit: 8.0, stock_quantity: 250, manufacturer: 'Sun Pharma', category: 'Vitamin/Supplement', is_active: true, tenantId },

      // Respiratory
      { drug_code: 'MED-030', name: 'Salbutamol Inhaler 100mcg', generic_name: 'Salbutamol', dosage_form: 'inhaler', strength: '100mcg', price_per_unit: 120.0, stock_quantity: 100, manufacturer: 'GSK', category: 'Respiratory', is_active: true, tenantId },
      { drug_code: 'MED-031', name: 'Montelukast IP 10mg', generic_name: 'Montelukast', dosage_form: 'tablet', strength: '10mg', price_per_unit: 15.0, stock_quantity: 200, manufacturer: 'Sun Pharma', category: 'Respiratory', is_active: true, tenantId },
      { drug_code: 'MED-032', name: 'Cetirizine IP 10mg', generic_name: 'Cetirizine', dosage_form: 'tablet', strength: '10mg', price_per_unit: 3.0, stock_quantity: 300, manufacturer: 'Cipla', category: 'Respiratory/Antihistamine', is_active: true, tenantId },
      { drug_code: 'MED-033', name: 'Levocetirizine IP 5mg', generic_name: 'Levocetirizine', dosage_form: 'tablet', strength: '5mg', price_per_unit: 5.0, stock_quantity: 250, manufacturer: 'Dr. Reddy\'s', category: 'Respiratory/Antihistamine', is_active: true, tenantId },

      // Other
      { drug_code: 'MED-034', name: 'Ondansetron IP 4mg Injection', generic_name: 'Ondansetron', dosage_form: 'injection', strength: '4mg/2ml', price_per_unit: 35.0, stock_quantity: 150, manufacturer: 'Sun Pharma', category: 'Antiemetic', is_active: true, tenantId },
      { drug_code: 'MED-035', name: 'Tramadol HCl 50mg', generic_name: 'Tramadol', dosage_form: 'tablet', strength: '50mg', price_per_unit: 8.0, stock_quantity: 200, manufacturer: 'Cipla', category: 'Analgesic/Opioid', is_active: true, tenantId },
      { drug_code: 'MED-036', name: 'Clobetasol 0.05% Cream', generic_name: 'Clobetasol Propionate', dosage_form: 'cream', strength: '0.05%', price_per_unit: 45.0, stock_quantity: 100, manufacturer: 'GlaxoSmithKline', category: 'Corticosteroid/Topical', is_active: true, tenantId },
      { drug_code: 'MED-037', name: 'Betamethasone Injection', generic_name: 'Betamethasone', dosage_form: 'injection', strength: '4mg/ml', price_per_unit: 60.0, stock_quantity: 100, manufacturer: 'Merck', category: 'Corticosteroid', is_active: true, tenantId },
      { drug_code: 'MED-038', name: 'Dexamethasone 4mg Injection', generic_name: 'Dexamethasone', dosage_form: 'injection', strength: '4mg/ml', price_per_unit: 40.0, stock_quantity: 150, manufacturer: 'Sun Pharma', category: 'Corticosteroid', is_active: true, tenantId },
      { drug_code: 'MED-039', name: 'Hydrocortisone Cream 1%', generic_name: 'Hydrocortisone', dosage_form: 'cream', strength: '1%', price_per_unit: 30.0, stock_quantity: 120, manufacturer: 'Cipla', category: 'Corticosteroid/Topical', is_active: true, tenantId },
      { drug_code: 'MED-040', name: 'Methylprednisolone 4mg', generic_name: 'Methylprednisolone', dosage_form: 'tablet', strength: '4mg', price_per_unit: 20.0, stock_quantity: 150, manufacturer: 'Pfizer', category: 'Corticosteroid', is_active: true, tenantId },
    ];

    for (const med of medications) {
      await this.medicationModel.findOneAndUpdate(
        { tenantId: med.tenantId, drug_code: med.drug_code },
        { $set: med },
        { upsert: true, new: true },
      );
      console.log(`   ✅ Upserted medication ${med.drug_code} - ${med.name}`);
    }

    console.log(`✅ Medications seeded successfully! (${medications.length} medications)`);
  }

  // ---------------------------------------------------------------------------
  // Tenant
  // ---------------------------------------------------------------------------

  async seedTenant(): Promise<void> {
    console.log('🔄 Seeding default tenant...');
    const tenantId = this.DEFAULT_TENANT_ID;
    await this.tenantModel.findOneAndUpdate(
      { tenantId },
      {
        $setOnInsert: {
          name: 'MedSystem Multi-Specialty Hospital',
          tenantId,
          fieldConfigurations: new Map(),
          createdBy: 'system',
          updatedBy: 'system',
        },
      },
      { upsert: true, new: true },
    );
    console.log(`✅ Tenant '${tenantId}' ensured.`);
  }

  // ---------------------------------------------------------------------------
  // Vendors
  // ---------------------------------------------------------------------------

  async seedVendors(): Promise<void> {
    console.log('🔄 Seeding vendors...');
    const tenantId = this.DEFAULT_TENANT_ID;

    const vendors = [
      {
        vendor_code: 'VEN-001', name: 'PharmaCorp India Pvt Ltd', legal_name: 'PharmaCorp India Pvt Ltd',
        tax_id: 'GSTIN27AACCP1234F1Z5', address: '12, Pharma Industrial Estate, Andheri East, Mumbai - 400069',
        contact_persons: ['Rajesh Kumar (Sales Manager)', 'Sunita Devi (Accounts)'],
        payment_terms: 'Net 30', default_lead_time_days: 7,
        supported_tax_slabs: ['GST-5', 'GST-12'],
        custom_fields: { email: 'procurement@pharmacorp.in', phone: '+91-22-26834500', city: 'Mumbai', state: 'Maharashtra', category: 'Pharma Distributor', status: 'active', creditLimit: 500000 },
        tenantId,
      },
      {
        vendor_code: 'VEN-002', name: 'MedEquip Solutions Ltd', legal_name: 'MedEquip Solutions Ltd',
        tax_id: 'GSTIN07AACCM5678G1Z3', address: '45, Sector 18, Gurugram, Haryana - 122015',
        contact_persons: ['Amit Verma (Regional Head)', 'Priya Nair (Service)'],
        payment_terms: 'Net 45', default_lead_time_days: 14,
        supported_tax_slabs: ['GST-18', 'GST-28'],
        custom_fields: { email: 'sales@medequip.in', phone: '+91-124-4567890', city: 'Gurugram', state: 'Haryana', category: 'Medical Equipment', status: 'active', creditLimit: 1000000 },
        tenantId,
      },
      {
        vendor_code: 'VEN-003', name: 'Sunrise Surgical Supplies', legal_name: 'Sunrise Surgical Supplies',
        tax_id: 'GSTIN29AACCS9012H1Z1', address: '78, KIADB Industrial Area, Peenya, Bengaluru - 560058',
        contact_persons: ['Dr. Sanjay Rao (Technical Head)'],
        payment_terms: 'Net 30', default_lead_time_days: 10,
        supported_tax_slabs: ['GST-12', 'GST-18'],
        custom_fields: { email: 'orders@sunrisesurgical.in', phone: '+91-80-28392500', city: 'Bengaluru', state: 'Karnataka', category: 'Surgical Supplies', status: 'active', creditLimit: 750000 },
        tenantId,
      },
      {
        vendor_code: 'VEN-004', name: 'Apollo Diagnostics Supply Co', legal_name: 'Apollo Diagnostics Supply Co',
        tax_id: 'GSTIN33AAACA3456I1Z7', address: '23, Greams Road, Nungambakkam, Chennai - 600006',
        contact_persons: ['Kavitha Subramanian (Key Account)'],
        payment_terms: 'Net 15', default_lead_time_days: 5,
        supported_tax_slabs: ['GST-12', 'GST-18'],
        custom_fields: { email: 'supply@apollodx.in', phone: '+91-44-28293000', city: 'Chennai', state: 'Tamil Nadu', category: 'Diagnostics & Lab', status: 'active', creditLimit: 300000 },
        tenantId,
      },
      {
        vendor_code: 'VEN-005', name: 'NovaMed Pharmaceuticals', legal_name: 'NovaMed Pharmaceuticals Pvt Ltd',
        tax_id: 'GSTIN06AAACN7890J1Z9', address: '56, IMT Manesar, Gurgaon, Haryana - 122051',
        contact_persons: ['Vivek Sharma (GM Sales)'],
        payment_terms: 'Net 60', default_lead_time_days: 7,
        supported_tax_slabs: ['GST-5', 'GST-12'],
        custom_fields: { email: 'orders@novamed.in', phone: '+91-124-2345678', city: 'Gurgaon', state: 'Haryana', category: 'Pharma Distributor', status: 'active', creditLimit: 600000 },
        tenantId,
      },
      {
        vendor_code: 'VEN-006', name: 'LifeCare PPE & Consumables', legal_name: 'LifeCare PPE & Consumables',
        tax_id: 'GSTIN24AAACEL2345K1Z2', address: '89, GIDC Vatva, Ahmedabad, Gujarat - 382445',
        contact_persons: ['Harshad Patel (Director)'],
        payment_terms: 'Net 30', default_lead_time_days: 7,
        supported_tax_slabs: ['GST-12', 'GST-18'],
        custom_fields: { email: 'info@lifecarebbe.in', phone: '+91-79-25831200', city: 'Ahmedabad', state: 'Gujarat', category: 'PPE & Consumables', status: 'active', creditLimit: 250000 },
        tenantId,
      },
      {
        vendor_code: 'VEN-007', name: 'BioTech Lab Instruments', legal_name: 'BioTech Lab Instruments Pvt Ltd',
        tax_id: 'GSTIN36AAACB5678L1Z4', address: '14, IDA Nacharam, Hyderabad, Telangana - 500076',
        contact_persons: ['Dr. Ramesh Choudhary (CTO)'],
        payment_terms: 'Net 45', default_lead_time_days: 21,
        supported_tax_slabs: ['GST-18', 'GST-28'],
        custom_fields: { email: 'sales@biotechlab.in', phone: '+91-40-27152000', city: 'Hyderabad', state: 'Telangana', category: 'Laboratory Equipment', status: 'active', creditLimit: 800000 },
        tenantId,
      },
      {
        vendor_code: 'VEN-008', name: 'IndoMed Oxygen & Gases', legal_name: 'IndoMed Oxygen & Gases Ltd',
        tax_id: 'GSTIN19AAACI8901M1Z6', address: '34, Durgapur Industrial Zone, Durgapur, West Bengal - 713212',
        contact_persons: ['Subroto Das (Operations Head)'],
        payment_terms: 'Net 15', default_lead_time_days: 3,
        supported_tax_slabs: ['GST-5', 'GST-18'],
        custom_fields: { email: 'supply@indomed.in', phone: '+91-343-2587900', city: 'Durgapur', state: 'West Bengal', category: 'Medical Gases', status: 'active', creditLimit: 200000 },
        tenantId,
      },
    ];

    for (const v of vendors) {
      await this.vendorModel.findOneAndUpdate(
        { tenantId, vendor_code: v.vendor_code },
        { $set: { ...v, createdBy: 'system', updatedBy: 'system' } },
        { upsert: true, new: true },
      );
      console.log(`   ✅ Upserted vendor ${v.vendor_code} - ${v.name}`);
    }
    console.log(`✅ Vendors seeded! (${vendors.length})`);
  }

  // ---------------------------------------------------------------------------
  // Patients
  // ---------------------------------------------------------------------------

  async seedPatients(): Promise<void> {
    console.log('🔄 Seeding patients...');
    const tenantId = this.DEFAULT_TENANT_ID;

    const patients = [
      { patient_id: 'PAT-0001', first_name: 'Arvind', last_name: 'Sharma', gender: 'Male', dob: '1968-04-15', phone: '+91-9811234567', email: 'arvind.sharma@email.com', blood_group: 'B+', address: 'H-45, Sector 15, Noida - 201301', allergies: ['Penicillin'], existing_conditions: ['Hypertension', 'Type 2 Diabetes'], status: 'admitted', department: 'Cardiology' },
      { patient_id: 'PAT-0002', first_name: 'Sunita', last_name: 'Mehta', gender: 'Female', dob: '1975-09-22', phone: '+91-9922345678', email: 'sunita.mehta@email.com', blood_group: 'A+', address: '23, MG Road, Pune - 411001', allergies: [], existing_conditions: ['Asthma'], status: 'admitted', department: 'General Medicine' },
      { patient_id: 'PAT-0003', first_name: 'Rajan', last_name: 'Pillai', gender: 'Male', dob: '1955-12-03', phone: '+91-9833456789', email: 'rajan.pillai@email.com', blood_group: 'O-', address: '67, Anna Nagar, Chennai - 600040', allergies: ['Sulfa'], existing_conditions: ['Coronary Artery Disease', 'Hypertension'], status: 'admitted', department: 'Cardiology' },
      { patient_id: 'PAT-0004', first_name: 'Priya', last_name: 'Nair', gender: 'Female', dob: '1990-06-18', phone: '+91-9744567890', email: 'priya.nair@email.com', blood_group: 'AB+', address: '12, Indiranagar, Bengaluru - 560038', allergies: [], existing_conditions: [], status: 'admitted', department: 'Gynaecology' },
      { patient_id: 'PAT-0005', first_name: 'Mohammed', last_name: 'Iqbal', gender: 'Male', dob: '1980-02-28', phone: '+91-9655678901', email: 'mohammed.iqbal@email.com', blood_group: 'O+', address: '89, Banjara Hills, Hyderabad - 500034', allergies: ['Aspirin'], existing_conditions: ['Epilepsy'], status: 'admitted', department: 'Neurology' },
      { patient_id: 'PAT-0006', first_name: 'Kavya', last_name: 'Reddy', gender: 'Female', dob: '2001-11-07', phone: '+91-9566789012', email: 'kavya.reddy@email.com', blood_group: 'B-', address: '34, Jubilee Hills, Hyderabad - 500033', allergies: [], existing_conditions: [], status: 'admitted', department: 'Orthopaedics' },
      { patient_id: 'PAT-0007', first_name: 'Suresh', last_name: 'Patel', gender: 'Male', dob: '1945-07-30', phone: '+91-9477890123', email: 'suresh.patel@email.com', blood_group: 'A-', address: '56, Navrangpura, Ahmedabad - 380009', allergies: ['Iodine'], existing_conditions: ['COPD', 'Hypertension'], status: 'admitted', department: 'General Medicine' },
      { patient_id: 'PAT-0008', first_name: 'Ananya', last_name: 'Singh', gender: 'Female', dob: '2022-03-14', phone: '+91-9388901234', email: 'ananya.parent@email.com', blood_group: 'B+', address: '78, Vasant Vihar, New Delhi - 110057', allergies: [], existing_conditions: ['Premature Birth Complications'], status: 'admitted', department: 'Paediatrics' },
      { patient_id: 'PAT-0009', first_name: 'Deepak', last_name: 'Kumar', gender: 'Male', dob: '1972-05-19', phone: '+91-9299012345', email: 'deepak.kumar@email.com', blood_group: 'O+', address: '90, Karol Bagh, New Delhi - 110005', allergies: [], existing_conditions: ['Kidney Stones'], status: 'active', department: 'Urology' },
      { patient_id: 'PAT-0010', first_name: 'Rekha', last_name: 'Iyer', gender: 'Female', dob: '1983-08-25', phone: '+91-9110123456', email: 'rekha.iyer@email.com', blood_group: 'A+', address: '45, T Nagar, Chennai - 600017', allergies: ['NSAIDs'], existing_conditions: ['Rheumatoid Arthritis'], status: 'active', department: 'Orthopaedics' },
      { patient_id: 'PAT-0011', first_name: 'Aditya', last_name: 'Joshi', gender: 'Male', dob: '1995-01-12', phone: '+91-9021234567', email: 'aditya.joshi@email.com', blood_group: 'AB-', address: '23, Koregaon Park, Pune - 411001', allergies: [], existing_conditions: [], status: 'active', department: 'General Medicine' },
      { patient_id: 'PAT-0012', first_name: 'Lakshmi', last_name: 'Krishnan', gender: 'Female', dob: '1961-10-05', phone: '+91-9932345678', email: 'lakshmi.krishnan@email.com', blood_group: 'O+', address: '67, Adyar, Chennai - 600020', allergies: ['Latex'], existing_conditions: ['Type 2 Diabetes', 'Hypothyroidism'], status: 'discharged', department: 'Endocrinology' },
      { patient_id: 'PAT-0013', first_name: 'Vikram', last_name: 'Chauhan', gender: 'Male', dob: '1988-03-30', phone: '+91-9843456789', email: 'vikram.chauhan@email.com', blood_group: 'B+', address: '89, Civil Lines, Jaipur - 302006', allergies: [], existing_conditions: ['Migraine'], status: 'active', department: 'Neurology' },
      { patient_id: 'PAT-0014', first_name: 'Meena', last_name: 'Gupta', gender: 'Female', dob: '1970-12-17', phone: '+91-9754567890', email: 'meena.gupta@email.com', blood_group: 'A-', address: '12, Hazratganj, Lucknow - 226001', allergies: ['Codeine'], existing_conditions: ['Hypertension', 'Chronic Back Pain'], status: 'active', department: 'Orthopaedics' },
      { patient_id: 'PAT-0015', first_name: 'Rohan', last_name: 'Malhotra', gender: 'Male', dob: '2005-06-08', phone: '+91-9665678901', email: 'rohan.parent@email.com', blood_group: 'O-', address: '34, Defence Colony, New Delhi - 110024', allergies: [], existing_conditions: ['Thalassemia Minor'], status: 'discharged', department: 'Haematology' },
    ];

    for (const p of patients) {
      await this.patientModel.findOneAndUpdate(
        { tenantId, patient_id: p.patient_id },
        {
          $set: {
            ...p,
            emergency_contact_name: `${p.first_name}'s Family`,
            emergency_contact_phone: p.phone,
            tenantId,
            createdBy: 'system',
            updatedBy: 'system',
          },
        },
        { upsert: true, new: true },
      );
      console.log(`   ✅ Upserted patient ${p.patient_id} - ${p.first_name} ${p.last_name}`);
    }
    console.log(`✅ Patients seeded! (${patients.length})`);
  }

  // ---------------------------------------------------------------------------
  // Inventory Items
  // ---------------------------------------------------------------------------

  async seedInventoryItems(): Promise<void> {
    console.log('🔄 Seeding inventory items...');
    const tenantId = this.DEFAULT_TENANT_ID;

    const items = [
      { sku: 'INV-SURG-001', name: 'Disposable Surgical Gloves (Box of 100)', category: 'PPE & Consumables', unit_of_measure: 'box', unit_price: 350, current_stock: 120, min_stock_level: 30, reorder_quantity: 50, is_active: true },
      { sku: 'INV-SURG-002', name: 'N95 Respirator Mask', category: 'PPE & Consumables', unit_of_measure: 'pcs', unit_price: 45, current_stock: 500, min_stock_level: 100, reorder_quantity: 200, is_active: true },
      { sku: 'INV-SURG-003', name: '3-Ply Surgical Mask (Box of 50)', category: 'PPE & Consumables', unit_of_measure: 'box', unit_price: 150, current_stock: 200, min_stock_level: 50, reorder_quantity: 100, is_active: true },
      { sku: 'INV-SURG-004', name: 'Sterile Surgical Gown', category: 'PPE & Consumables', unit_of_measure: 'pcs', unit_price: 120, current_stock: 80, min_stock_level: 20, reorder_quantity: 40, is_active: true },
      { sku: 'INV-IV-001', name: 'IV Cannula 20G (Box of 50)', category: 'IV & Infusion', unit_of_measure: 'box', unit_price: 480, current_stock: 60, min_stock_level: 15, reorder_quantity: 30, is_active: true },
      { sku: 'INV-IV-002', name: 'Normal Saline 500ml', category: 'IV Fluids', unit_of_measure: 'bottle', unit_price: 35, current_stock: 300, min_stock_level: 100, reorder_quantity: 200, is_active: true },
      { sku: 'INV-IV-003', name: 'Ringer Lactate 500ml', category: 'IV Fluids', unit_of_measure: 'bottle', unit_price: 38, current_stock: 200, min_stock_level: 80, reorder_quantity: 150, is_active: true },
      { sku: 'INV-IV-004', name: 'Dextrose 5% 500ml', category: 'IV Fluids', unit_of_measure: 'bottle', unit_price: 40, current_stock: 180, min_stock_level: 60, reorder_quantity: 120, is_active: true },
      { sku: 'INV-DIAG-001', name: 'Blood Glucose Test Strips (Box of 50)', category: 'Diagnostics', unit_of_measure: 'box', unit_price: 650, current_stock: 40, min_stock_level: 10, reorder_quantity: 20, is_active: true },
      { sku: 'INV-DIAG-002', name: 'CBC Blood Collection Tubes (Vacutainer)', category: 'Diagnostics', unit_of_measure: 'pcs', unit_price: 18, current_stock: 500, min_stock_level: 100, reorder_quantity: 300, is_active: true },
      { sku: 'INV-DIAG-003', name: 'Urine Collection Cup (Pack of 50)', category: 'Diagnostics', unit_of_measure: 'pack', unit_price: 250, current_stock: 30, min_stock_level: 10, reorder_quantity: 20, is_active: true },
      { sku: 'INV-EQUIP-001', name: 'Digital Thermometer', category: 'Medical Equipment', unit_of_measure: 'pcs', unit_price: 450, current_stock: 25, min_stock_level: 5, reorder_quantity: 10, is_active: true },
      { sku: 'INV-EQUIP-002', name: 'Pulse Oximeter', category: 'Medical Equipment', unit_of_measure: 'pcs', unit_price: 1200, current_stock: 15, min_stock_level: 3, reorder_quantity: 5, is_active: true },
      { sku: 'INV-EQUIP-003', name: 'BP Monitor (Automatic)', category: 'Medical Equipment', unit_of_measure: 'pcs', unit_price: 2800, current_stock: 12, min_stock_level: 3, reorder_quantity: 5, is_active: true },
      { sku: 'INV-EQUIP-004', name: 'Nebulizer Machine', category: 'Medical Equipment', unit_of_measure: 'pcs', unit_price: 3500, current_stock: 8, min_stock_level: 2, reorder_quantity: 3, is_active: true },
      { sku: 'INV-WOUND-001', name: 'Sterile Bandage Roll 10cm (Box of 12)', category: 'Wound Care', unit_of_measure: 'box', unit_price: 180, current_stock: 90, min_stock_level: 20, reorder_quantity: 40, is_active: true },
      { sku: 'INV-WOUND-002', name: 'Adhesive Bandage (Box of 100)', category: 'Wound Care', unit_of_measure: 'box', unit_price: 120, current_stock: 150, min_stock_level: 30, reorder_quantity: 60, is_active: true },
      { sku: 'INV-WOUND-003', name: 'Betadine Solution 500ml', category: 'Wound Care', unit_of_measure: 'bottle', unit_price: 95, current_stock: 60, min_stock_level: 15, reorder_quantity: 30, is_active: true },
      { sku: 'INV-GAS-001', name: 'Medical Oxygen Cylinder (D-Type)', category: 'Medical Gases', unit_of_measure: 'cylinder', unit_price: 750, current_stock: 20, min_stock_level: 5, reorder_quantity: 10, is_active: true },
      { sku: 'INV-STERIL-001', name: 'Autoclave Sterilization Pouches (Box of 200)', category: 'Sterilization', unit_of_measure: 'box', unit_price: 280, current_stock: 35, min_stock_level: 8, reorder_quantity: 15, is_active: true },
    ];

    for (const item of items) {
      await this.inventoryModel.findOneAndUpdate(
        { tenantId, sku: item.sku },
        { $set: { ...item, tenantId, createdBy: 'system', updatedBy: 'system' } },
        { upsert: true, new: true },
      );
      console.log(`   ✅ Upserted inventory ${item.sku} - ${item.name}`);
    }
    console.log(`✅ Inventory items seeded! (${items.length})`);
  }

  // ---------------------------------------------------------------------------
  // Admissions  (links patients → rooms → doctors)
  // ---------------------------------------------------------------------------

  async seedAdmissions(): Promise<void> {
    console.log('🔄 Seeding admissions...');
    const tenantId = this.DEFAULT_TENANT_ID;

    const admissionPlans = [
      { patientId: 'PAT-0001', roomNumber: 'P301', doctorId: 'DR-001', type: 'planned', date: '2026-05-10', expectedDischarge: '2026-05-20', payment: 'insurance', insurance: 'Star Health Insurance', policyNo: 'SHI-2024-0018734', notes: 'Pre-op evaluation for CABG', status: 'active' },
      { patientId: 'PAT-0002', roomNumber: 'G101', doctorId: 'DR-004', type: 'emergency', date: '2026-05-14', expectedDischarge: '2026-05-18', payment: 'cash', notes: 'Severe bronchitis exacerbation', status: 'active' },
      { patientId: 'PAT-0003', roomNumber: 'D305', doctorId: 'DR-001', type: 'planned', date: '2026-05-12', expectedDischarge: '2026-05-22', payment: 'corporate', corporate: 'Tata Consultancy Services', notes: 'Angioplasty - post-procedure monitoring', status: 'active' },
      { patientId: 'PAT-0004', roomNumber: 'S204', doctorId: 'DR-009', type: 'planned', date: '2026-05-15', expectedDischarge: '2026-05-19', payment: 'insurance', insurance: 'HDFC Ergo Health', policyNo: 'HDFC-2025-003421', notes: 'Scheduled C-section delivery', status: 'active' },
      { patientId: 'PAT-0005', roomNumber: 'P303', doctorId: 'DR-003', type: 'emergency', date: '2026-05-13', expectedDischarge: '2026-05-21', payment: 'government', notes: 'Status epilepticus - now stable on medication', status: 'active' },
      { patientId: 'PAT-0006', roomNumber: 'S202', doctorId: 'DR-002', type: 'planned', date: '2026-05-16', expectedDischarge: '2026-05-23', payment: 'insurance', insurance: 'New India Assurance', policyNo: 'NIA-2024-778921', notes: 'ACL reconstruction surgery', status: 'active' },
      { patientId: 'PAT-0007', roomNumber: 'G105', doctorId: 'DR-004', type: 'emergency', date: '2026-05-11', expectedDischarge: '2026-05-19', payment: 'cash', notes: 'Acute COPD exacerbation with pneumonia', status: 'active' },
      { patientId: 'PAT-0008', roomNumber: 'G102', doctorId: 'DR-005', type: 'emergency', date: '2026-05-15', expectedDischarge: '2026-05-25', payment: 'government', notes: 'NICU - Preterm 32 weeks, respiratory distress', status: 'active' },
    ];

    for (const plan of admissionPlans) {
      const patient = await this.patientModel.findOne({ tenantId, patient_id: plan.patientId });
      const room = await this.roomModel.findOne({ tenantId, room_number: plan.roomNumber });
      const doctor = await this.doctorModel.findOne({ tenantId, employee_id: plan.doctorId });

      if (!patient || !room || !doctor) {
        console.log(`   ⚠️  Skipping admission for ${plan.patientId} - missing patient/room/doctor`);
        continue;
      }

      const admNumber = `ADM-${String(admissionPlans.indexOf(plan) + 1).padStart(4, '0')}`;

      await this.admissionModel.findOneAndUpdate(
        { tenantId, admission_number: admNumber },
        {
          $set: {
            admission_number: admNumber,
            patient_id: patient._id,
            room_id: room._id,
            doctor_id: doctor._id,
            admission_date: new Date(plan.date),
            expected_discharge_date: new Date(plan.expectedDischarge),
            admission_type: plan.type,
            status: plan.status,
            payment_mode: plan.payment,
            insurance_provider: plan.insurance || undefined,
            insurance_policy_no: plan.policyNo || undefined,
            corporate_account: plan.corporate || undefined,
            notes: plan.notes,
            tenantId,
            createdBy: 'system',
            updatedBy: 'system',
          },
        },
        { upsert: true, new: true },
      );

      // Mark room as occupied
      await this.roomModel.findOneAndUpdate(
        { tenantId, room_number: plan.roomNumber },
        { $set: { status: 'occupied' } },
      );

      console.log(`   ✅ Upserted admission ${admNumber} — ${plan.patientId} → Room ${plan.roomNumber} (Dr. ${plan.doctorId})`);
    }
    console.log(`✅ Admissions seeded!`);
  }

  // ---------------------------------------------------------------------------
  // Purchase Orders
  // ---------------------------------------------------------------------------

  async seedPurchaseOrders(): Promise<void> {
    console.log('🔄 Seeding purchase orders...');
    const tenantId = this.DEFAULT_TENANT_ID;

    const orders = [
      {
        po_number: 'PO-2026-00001',
        vendor_name: 'PharmaCorp India Pvt Ltd', vendor_id: 'VEN-001',
        vendor_phone: '+91-22-26834500', vendor_email: 'procurement@pharmacorp.in',
        vendor_address: '12, Pharma Industrial Estate, Andheri East, Mumbai - 400069',
        order_date: '2026-05-01', delivery_date: '2026-05-08',
        status: 'fulfilled',
        items: [
          { name: 'Paracetamol IP 500mg', qty: 500, unitPrice: 1.5, discount: 0, subtotal: 750, taxSlab: 5 },
          { name: 'Amoxicillin IP 500mg', qty: 200, unitPrice: 8.0, discount: 5, subtotal: 1520, taxSlab: 12 },
          { name: 'Metformin HCl 500mg', qty: 300, unitPrice: 3.0, discount: 0, subtotal: 900, taxSlab: 5 },
        ],
        grand_total: 38394, paid_amount: 38394, payment_method: 'bank_transfer',
        shipping_address: 'MedSystem Hospital, Receiving Dept, Block A, Sector 12',
        notes: 'Urgent order - stock replenishment',
      },
      {
        po_number: 'PO-2026-00002',
        vendor_name: 'MedEquip Solutions Ltd', vendor_id: 'VEN-002',
        vendor_phone: '+91-124-4567890', vendor_email: 'sales@medequip.in',
        vendor_address: '45, Sector 18, Gurugram, Haryana - 122015',
        order_date: '2026-05-03', delivery_date: '2026-05-17',
        status: 'approved',
        items: [
          { name: 'Pulse Oximeter', qty: 5, unitPrice: 1200, discount: 10, subtotal: 5400, taxSlab: 18 },
          { name: 'Digital Thermometer', qty: 10, unitPrice: 450, discount: 0, subtotal: 4500, taxSlab: 18 },
          { name: 'Automatic BP Monitor', qty: 3, unitPrice: 2800, discount: 5, subtotal: 7980, taxSlab: 18 },
        ],
        grand_total: 23452, paid_amount: 0, payment_method: 'credit',
        shipping_address: 'MedSystem Hospital, Equipment Store, Block B',
        notes: 'Q2 equipment refresh',
      },
      {
        po_number: 'PO-2026-00003',
        vendor_name: 'LifeCare PPE & Consumables', vendor_id: 'VEN-006',
        vendor_phone: '+91-79-25831200', vendor_email: 'info@lifecarebbe.in',
        vendor_address: '89, GIDC Vatva, Ahmedabad, Gujarat - 382445',
        order_date: '2026-05-05', delivery_date: '2026-05-12',
        status: 'fulfilled',
        items: [
          { name: 'Disposable Surgical Gloves (Box 100)', qty: 50, unitPrice: 350, discount: 0, subtotal: 17500, taxSlab: 12 },
          { name: 'N95 Respirator Mask', qty: 200, unitPrice: 45, discount: 0, subtotal: 9000, taxSlab: 12 },
          { name: '3-Ply Surgical Mask (Box 50)', qty: 100, unitPrice: 150, discount: 5, subtotal: 14250, taxSlab: 12 },
        ],
        grand_total: 45696, paid_amount: 45696, payment_method: 'bank_transfer',
        shipping_address: 'MedSystem Hospital, Central Stores',
        notes: 'Monthly PPE replenishment',
      },
      {
        po_number: 'PO-2026-00004',
        vendor_name: 'Sunrise Surgical Supplies', vendor_id: 'VEN-003',
        vendor_phone: '+91-80-28392500', vendor_email: 'orders@sunrisesurgical.in',
        vendor_address: '78, KIADB Industrial Area, Peenya, Bengaluru - 560058',
        order_date: '2026-05-08', delivery_date: '2026-05-18',
        status: 'approved',
        items: [
          { name: 'Sterile Bandage Roll 10cm (Box 12)', qty: 30, unitPrice: 180, discount: 0, subtotal: 5400, taxSlab: 12 },
          { name: 'IV Cannula 20G (Box 50)', qty: 20, unitPrice: 480, discount: 5, subtotal: 9120, taxSlab: 12 },
          { name: 'Sterile Surgical Gown', qty: 40, unitPrice: 120, discount: 0, subtotal: 4800, taxSlab: 12 },
        ],
        grand_total: 21702, paid_amount: 10000, payment_method: 'cheque',
        shipping_address: 'MedSystem Hospital, OT Stores, Block C',
        notes: 'OT supplies - pre-surgery stock',
      },
      {
        po_number: 'PO-2026-00005',
        vendor_name: 'IndoMed Oxygen & Gases', vendor_id: 'VEN-008',
        vendor_phone: '+91-343-2587900', vendor_email: 'supply@indomed.in',
        vendor_address: '34, Durgapur Industrial Zone, West Bengal - 713212',
        order_date: '2026-05-10', delivery_date: '2026-05-13',
        status: 'fulfilled',
        items: [
          { name: 'Medical Oxygen Cylinder (D-Type)', qty: 10, unitPrice: 750, discount: 0, subtotal: 7500, taxSlab: 5 },
        ],
        grand_total: 7875, paid_amount: 7875, payment_method: 'bank_transfer',
        shipping_address: 'MedSystem Hospital, Gas Storage Area, Basement',
        notes: 'Emergency oxygen restock - ICU requirement',
      },
      {
        po_number: 'PO-2026-00006',
        vendor_name: 'NovaMed Pharmaceuticals', vendor_id: 'VEN-005',
        vendor_phone: '+91-124-2345678', vendor_email: 'orders@novamed.in',
        vendor_address: '56, IMT Manesar, Gurgaon, Haryana - 122051',
        order_date: '2026-05-12', delivery_date: '2026-05-19',
        status: 'draft',
        items: [
          { name: 'Insulin Regular 100IU/ml', qty: 50, unitPrice: 180, discount: 0, subtotal: 9000, taxSlab: 5 },
          { name: 'Amlodipine IP 5mg', qty: 400, unitPrice: 5.0, discount: 0, subtotal: 2000, taxSlab: 5 },
          { name: 'Losartan Potassium 50mg', qty: 300, unitPrice: 8.0, discount: 0, subtotal: 2400, taxSlab: 5 },
          { name: 'Metoprolol Tartrate 25mg', qty: 300, unitPrice: 5.0, discount: 0, subtotal: 1500, taxSlab: 5 },
        ],
        grand_total: 15645, paid_amount: 0, payment_method: 'credit',
        shipping_address: 'MedSystem Hospital, Pharmacy Stores',
        notes: 'Cardiac medicines monthly order - pending finance approval',
      },
      {
        po_number: 'PO-2026-00007',
        vendor_name: 'Apollo Diagnostics Supply Co', vendor_id: 'VEN-004',
        vendor_phone: '+91-44-28293000', vendor_email: 'supply@apollodx.in',
        vendor_address: '23, Greams Road, Nungambakkam, Chennai - 600006',
        order_date: '2026-05-14', delivery_date: '2026-05-19',
        status: 'approved',
        items: [
          { name: 'Blood Glucose Test Strips (Box 50)', qty: 20, unitPrice: 650, discount: 0, subtotal: 13000, taxSlab: 12 },
          { name: 'CBC Blood Collection Tubes', qty: 500, unitPrice: 18, discount: 5, subtotal: 8550, taxSlab: 12 },
          { name: 'Urine Collection Cup (Pack 50)', qty: 15, unitPrice: 250, discount: 0, subtotal: 3750, taxSlab: 12 },
        ],
        grand_total: 28364, paid_amount: 0, payment_method: 'credit',
        shipping_address: 'MedSystem Hospital, Pathology Lab',
        notes: 'Lab consumables - biweekly order',
      },
      {
        po_number: 'PO-2026-00008',
        vendor_name: 'BioTech Lab Instruments', vendor_id: 'VEN-007',
        vendor_phone: '+91-40-27152000', vendor_email: 'sales@biotechlab.in',
        vendor_address: '14, IDA Nacharam, Hyderabad, Telangana - 500076',
        order_date: '2026-05-15', delivery_date: '2026-06-05',
        status: 'draft',
        items: [
          { name: 'Haematology Analyser (5-part differential)', qty: 1, unitPrice: 285000, discount: 5, subtotal: 270750, taxSlab: 18 },
          { name: 'Calibration Kit for Haematology Analyser', qty: 2, unitPrice: 8500, discount: 0, subtotal: 17000, taxSlab: 18 },
        ],
        grand_total: 340591, paid_amount: 0, payment_method: 'credit',
        shipping_address: 'MedSystem Hospital, Pathology Lab, 2nd Floor',
        notes: 'Major capital equipment - board approval pending',
      },
    ];

    for (const po of orders) {
      await this.purchaseOrderModel.findOneAndUpdate(
        { tenantId, po_number: po.po_number },
        {
          $set: {
            ...po,
            tenantId,
            createdBy: 'system',
            updatedBy: 'system',
          },
        },
        { upsert: true, new: true },
      );
      console.log(`   ✅ Upserted PO ${po.po_number} — ${po.vendor_name} [${po.status}]`);
    }
    console.log(`✅ Purchase orders seeded! (${orders.length})`);
  }

  async seedSalesOrders(): Promise<void> {
    console.log('🔄 Seeding sales orders...');
    const tenantId = this.DEFAULT_TENANT_ID;

    const orders = [
      {
        so_number: 'SO-2026-00001',
        customer_name: 'City General Hospital', customer_id: 'CUST-001',
        customer_email: 'purchase@citygeneralhospital.in',
        customer_phone: '+91-22-26783400',
        customer_address: '34, Linking Road, Bandra West, Mumbai - 400050',
        order_date: '2026-04-15', delivery_date: '2026-04-22', due_date: '2026-04-30',
        status: 'Delivered', payment_status: 'Paid', payment_method: 'bank_transfer',
        items: [
          { name: 'Paracetamol IP 500mg', qty: 1000, unitPrice: 2.0, discount: 5, subtotal: 1900, taxSlab: 5 },
          { name: 'Disposable Surgical Gloves (Box 100)', qty: 20, unitPrice: 400, discount: 0, subtotal: 8000, taxSlab: 12 },
          { name: 'N95 Respirator Mask', qty: 500, unitPrice: 50, discount: 0, subtotal: 25000, taxSlab: 12 },
        ],
        grand_total: 42350, paid_amount: 42350,
        shipping_address: '34, Linking Road, Bandra West, Mumbai - 400050',
        billing_address: '34, Linking Road, Bandra West, Mumbai - 400050',
        notes: 'Regular monthly order — please ensure cold chain for injectables.',
      },
      {
        so_number: 'SO-2026-00002',
        customer_name: 'Sunrise Pharmacy Chain', customer_id: 'CUST-002',
        customer_email: 'orders@sunrisepharmacy.in',
        customer_phone: '+91-80-26574400',
        customer_address: '12, MG Road, Bengaluru - 560001',
        order_date: '2026-04-18', delivery_date: '2026-04-25', due_date: '2026-05-05',
        status: 'Delivered', payment_status: 'Paid', payment_method: 'upi',
        items: [
          { name: 'Amoxicillin IP 500mg', qty: 500, unitPrice: 10, discount: 10, subtotal: 4500, taxSlab: 12 },
          { name: 'Metformin HCl 500mg', qty: 800, unitPrice: 4.0, discount: 0, subtotal: 3200, taxSlab: 5 },
          { name: 'Digital Thermometer', qty: 30, unitPrice: 500, discount: 5, subtotal: 14250, taxSlab: 18 },
          { name: 'Insulin Regular 100IU/ml', qty: 100, unitPrice: 200, discount: 0, subtotal: 20000, taxSlab: 5 },
        ],
        grand_total: 48180, paid_amount: 48180,
        shipping_address: '12, MG Road, Bengaluru - 560001',
        billing_address: '12, MG Road, Bengaluru - 560001',
        notes: 'Diabetes care aisle restock — urgent delivery before weekend.',
      },
      {
        so_number: 'SO-2026-00003',
        customer_name: 'Apollo Clinic Network', customer_id: 'CUST-003',
        customer_email: 'procurement@apolloclinic.in',
        customer_phone: '+91-44-28292929',
        customer_address: '23, Nungambakkam High Road, Chennai - 600034',
        order_date: '2026-04-22', delivery_date: '2026-04-29', due_date: '2026-05-10',
        status: 'Shipped', payment_status: 'Pending', payment_method: 'credit',
        items: [
          { name: 'Blood Glucose Test Strips (Box 50)', qty: 50, unitPrice: 700, discount: 5, subtotal: 33250, taxSlab: 12 },
          { name: 'Pulse Oximeter', qty: 10, unitPrice: 1400, discount: 10, subtotal: 12600, taxSlab: 18 },
          { name: 'Automatic BP Monitor', qty: 5, unitPrice: 3000, discount: 5, subtotal: 14250, taxSlab: 18 },
        ],
        grand_total: 71528, paid_amount: 0,
        shipping_address: '23, Nungambakkam High Road, Chennai - 600034',
        billing_address: '23, Nungambakkam High Road, Chennai - 600034',
        notes: 'Q2 diagnostics equipment order — net 30 payment terms.',
      },
      {
        so_number: 'SO-2026-00004',
        customer_name: 'HealthPlus Diagnostics', customer_id: 'CUST-004',
        customer_email: 'lab@healthplusdx.in',
        customer_phone: '+91-40-27843200',
        customer_address: '56, Road No. 12, Banjara Hills, Hyderabad - 500034',
        order_date: '2026-05-01', delivery_date: '2026-05-08', due_date: '2026-05-15',
        status: 'Processing', payment_status: 'Paid', payment_method: 'bank_transfer',
        items: [
          { name: 'CBC Blood Collection Tubes', qty: 2000, unitPrice: 20, discount: 10, subtotal: 36000, taxSlab: 12 },
          { name: 'Urine Collection Cup (Pack 50)', qty: 40, unitPrice: 280, discount: 0, subtotal: 11200, taxSlab: 12 },
          { name: '3-Ply Surgical Mask (Box 50)', qty: 50, unitPrice: 180, discount: 0, subtotal: 9000, taxSlab: 12 },
        ],
        grand_total: 63392, paid_amount: 63392,
        shipping_address: '56, Road No. 12, Banjara Hills, Hyderabad - 500034',
        billing_address: '56, Road No. 12, Banjara Hills, Hyderabad - 500034',
        notes: 'Monthly lab consumables — please include certificate of analysis.',
      },
      {
        so_number: 'SO-2026-00005',
        customer_name: 'National Medical College', customer_id: 'CUST-005',
        customer_email: 'stores@nationalmedcollege.edu.in',
        customer_phone: '+91-11-23747843',
        customer_address: '7, Ansari Nagar, AIIMS Area, New Delhi - 110029',
        order_date: '2026-05-05', delivery_date: '2026-05-12', due_date: '2026-05-20',
        status: 'Processing', payment_status: 'Pending', payment_method: 'cheque',
        items: [
          { name: 'IV Normal Saline 500ml', qty: 200, unitPrice: 35, discount: 0, subtotal: 7000, taxSlab: 5 },
          { name: 'Lactated Ringer\'s Solution 500ml', qty: 100, unitPrice: 38, discount: 0, subtotal: 3800, taxSlab: 5 },
          { name: 'Sterile Bandage Roll 10cm (Box 12)', qty: 60, unitPrice: 200, discount: 5, subtotal: 11400, taxSlab: 12 },
          { name: 'Disposable Surgical Gloves (Box 100)', qty: 30, unitPrice: 420, discount: 0, subtotal: 12600, taxSlab: 12 },
        ],
        grand_total: 37940, paid_amount: 0,
        shipping_address: '7, Ansari Nagar, AIIMS Area, New Delhi - 110029',
        billing_address: '7, Ansari Nagar, AIIMS Area, New Delhi - 110029',
        notes: 'Awaiting finance clearance — please hold till confirmed.',
      },
      {
        so_number: 'SO-2026-00006',
        customer_name: 'CarePlus Hospital Group', customer_id: 'CUST-006',
        customer_email: 'supply@careplus.in',
        customer_phone: '+91-20-26872300',
        customer_address: '90, Karve Road, Kothrud, Pune - 411038',
        order_date: '2026-05-10', delivery_date: '2026-05-17', due_date: '2026-05-25',
        status: 'Pending', payment_status: 'Pending', payment_method: 'credit',
        items: [
          { name: 'Medical Oxygen Cylinder (D-Type)', qty: 5, unitPrice: 900, discount: 0, subtotal: 4500, taxSlab: 5 },
          { name: 'Amlodipine IP 5mg', qty: 1000, unitPrice: 6, discount: 0, subtotal: 6000, taxSlab: 5 },
          { name: 'Losartan Potassium 50mg', qty: 800, unitPrice: 9, discount: 0, subtotal: 7200, taxSlab: 5 },
        ],
        grand_total: 19278, paid_amount: 0,
        shipping_address: '90, Karve Road, Kothrud, Pune - 411038',
        billing_address: '90, Karve Road, Kothrud, Pune - 411038',
        notes: 'Cardiac medicine quarterly stock — new customer account.',
      },
    ];

    for (const so of orders) {
      await this.salesOrderModel.findOneAndUpdate(
        { tenantId, so_number: so.so_number },
        {
          $set: {
            ...so,
            tenantId,
            createdBy: 'system',
            updatedBy: 'system',
          },
        },
        { upsert: true, new: true },
      );
      console.log(`   ✅ Upserted SO ${so.so_number} — ${so.customer_name} [${so.status}]`);
    }
    console.log(`✅ Sales orders seeded! (${orders.length})`);
  }
}

async function main() {
  console.log('🚀 Starting database seeding...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    const roleModel = app.get<Model<RoleDocument>>(getModelToken(Role.name));
    const taxModel = app.get<Model<TaxDocument>>(getModelToken(Tax.name));
    const roomModel = app.get<Model<RoomDocument>>(getModelToken(Room.name));
    const doctorModel = app.get<Model<DoctorDocument>>(getModelToken(Doctor.name));
    const medicationModel = app.get<Model<MedicationDocument>>(getModelToken(Medication.name));
    const vendorModel = app.get<Model<VendorDocument>>(getModelToken(Vendor.name));
    const patientModel = app.get<Model<PatientDocument>>(getModelToken(Patient.name));
    const inventoryModel = app.get<Model<InventoryItemDocument>>(getModelToken(InventoryItem.name));
    const admissionModel = app.get<Model<AdmissionDocument>>(getModelToken(Admission.name));
    const purchaseOrderModel = app.get<Model<PurchaseOrderDocument>>(getModelToken(PurchaseOrder.name));
    const salesOrderModel = app.get<Model<SalesOrderDocument>>(getModelToken(SalesOrder.name));
    const tenantModel = app.get<Model<TenantDocument>>(getModelToken(Tenant.name));

    const seeder = new DatabaseSeeder(
      userModel, roleModel, taxModel, roomModel, doctorModel, medicationModel,
      vendorModel, patientModel, inventoryModel, admissionModel, purchaseOrderModel, salesOrderModel, tenantModel,
    );

    // Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'roles':
        await seeder.seedRoles();
        break;

      case 'users':
        await seeder.seedAdminUsers();
        break;

      case 'all':
      case 'seed':
        await seeder.seedTenant();
        await seeder.seedRoles();
        await seeder.seedAdminUsers();
        await seeder.seedTaxes();
        await seeder.seedRooms();
        await seeder.seedDoctors();
        await seeder.seedMedications();
        await seeder.seedVendors();
        await seeder.seedPatients();
        await seeder.seedInventoryItems();
        await seeder.seedAdmissions();
        await seeder.seedPurchaseOrders();
        await seeder.seedSalesOrders();
        break;

      case 'taxes':
        await seeder.seedTaxes();
        break;

      case 'rooms':
        await seeder.seedRooms();
        break;

      case 'doctors':
        await seeder.seedDoctors();
        break;

      case 'medications':
        await seeder.seedMedications();
        break;

      case 'tenant':
        await seeder.seedTenant();
        break;

      case 'vendors':
        await seeder.seedVendors();
        break;

      case 'patients':
        await seeder.seedPatients();
        break;

      case 'inventory':
        await seeder.seedInventoryItems();
        break;

      case 'admissions':
        await seeder.seedAdmissions();
        break;

      case 'purchase-orders':
        await seeder.seedPurchaseOrders();
        break;

      case 'demo':
        // Seed only the transactional demo data (assumes roles/users/taxes/rooms/doctors/meds already exist)
        await seeder.seedTenant();
        await seeder.seedVendors();
        await seeder.seedPatients();
        await seeder.seedInventoryItems();
        await seeder.seedAdmissions();
        await seeder.seedPurchaseOrders();
        await seeder.seedSalesOrders();
        break;

      case 'sales-orders':
        await seeder.seedSalesOrders();
        break;

      case 'list-taxes':
        await seeder.listTaxes();
        break;

      case 'create-user':
        const [, username, password, tenantId, ...roles] = args;
        if (!username || !password || roles.length === 0) {
          console.error(
            '❌ Usage: npm run seed create-user <username> <password> <tenantId> <role1> [role2] [role3]',
          );
          process.exit(1);
        }
        await seeder.createCustomUser(username, password, roles, tenantId);
        break;

      case 'list-users':
        await seeder.listUsers();
        break;

      case 'list-roles':
        await seeder.listRoles();
        break;

      default:
        console.log('📖 Available commands:');
        console.log(
          '   npm run seed roles          - Create/update default roles',
        );
        console.log(
          '   npm run seed users          - Create default admin users',
        );
        console.log(
          '   npm run seed taxes          - Create/update default taxes',
        );
        console.log('   npm run seed all            - Create roles, users, taxes, rooms, doctors, medications');
        console.log('   npm run seed seed           - Alias for all');
        console.log('   npm run seed rooms          - Create/update rooms');
        console.log('   npm run seed doctors        - Create/update doctors');
        console.log('   npm run seed medications    - Create/update medications');
        console.log(
          '   npm run seed create-user <username> <password> <tenantId> <role1> [role2] - Create custom user',
        );
        console.log('   npm run seed list-users     - List all users');
        console.log('   npm run seed list-roles     - List all roles');
        console.log('   npm run seed list-taxes     - List all taxes');
        console.log('');
        console.log('📋 Default users that will be created:');
        console.log(
          '   👤 admin@company.com (password: Admin123!) - Role: admin',
        );
        console.log(
          '   👤 manager@company.com (password: Manager123!) - Role: manager',
        );
        console.log('');
        console.log('💰 Default taxes that will be created:');
        console.log('   GST: 5%, 12%, 18%, 28% (India)');
        console.log('   VAT: 0%, 5%, 20% (UK)');
        console.log('   Sales Tax: 7%, 10% (USA)');
        console.log('   IGST, Service Tax, Environmental Tax, Luxury Tax');
        console.log('');
        console.log(
          '🔐 Available roles: admin, manager, user, finance, procurement, sales',
        );
        break;
    }
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await app.close();
    console.log('👋 Database seeding completed!');
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
