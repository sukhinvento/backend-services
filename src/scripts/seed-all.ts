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
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import { Role as RoleEnum, Scope } from '../common/enums';
import * as bcrypt from 'bcrypt';

class ComprehensiveSeeder {
  private userModel: Model<UserDocument>;
  private roleModel: Model<RoleDocument>;
  private taxModel: Model<TaxDocument>;
  private roomModel: Model<RoomDocument>;
  private doctorModel: Model<DoctorDocument>;
  private medicationModel: Model<MedicationDocument>;
  private vendorModel: Model<VendorDocument>;
  private patientModel: Model<PatientDocument>;
  private tenantModel: Model<TenantDocument>;

  private readonly DEFAULT_TENANT_ID = 'default_tenant';

  constructor(
    userModel: Model<UserDocument>,
    roleModel: Model<RoleDocument>,
    taxModel: Model<TaxDocument>,
    roomModel: Model<RoomDocument>,
    doctorModel: Model<DoctorDocument>,
    medicationModel: Model<MedicationDocument>,
    vendorModel: Model<VendorDocument>,
    patientModel: Model<PatientDocument>,
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
    this.tenantModel = tenantModel;
  }

  async seedAll(): Promise<void> {
    console.log('\n🚀 Starting comprehensive database seeding...\n');

    try {
      // 1. Tenants
      await this.seedTenants();

      // 2. Roles
      await this.seedRoles();

      // 3. Admin Users
      await this.seedAdminUsers();

      // 4. Tax Configurations
      await this.seedTaxes();

      // 5. Rooms
      await this.seedRooms();

      // 6. Doctors
      await this.seedDoctors();

      // 7. Medications
      await this.seedMedications();

      // 8. Vendors
      await this.seedVendors();

      // 9. Sample Patients
      await this.seedPatients();

      console.log('\n✅ All data seeded successfully!\n');
    } catch (error) {
      console.error('\n❌ Seeding failed:', error);
      throw error;
    }
  }

  private async seedTenants(): Promise<void> {
    console.log('🏢 Seeding tenants...');

    const tenants = [
      { name: 'default_tenant', description: 'Default tenant for development and testing' },
      { name: 'pharma_inc', description: 'Pharmaceutical company tenant' },
    ];

    for (const tenant of tenants) {
      const exists = await this.tenantModel.findOne({ name: tenant.name });
      if (exists) {
        console.log(`   ⚠️  Tenant '${tenant.name}' already exists`);
        continue;
      }
      await this.tenantModel.create({
        name: tenant.name,
        description: tenant.description,
        createdBy: 'system',
        updatedBy: 'system',
      });
      console.log(`   ✅ Created tenant '${tenant.name}'`);
    }
  }

  private async seedRoles(): Promise<void> {
    console.log('🔐 Seeding roles...');

    const roles = [
      {
        name: RoleEnum.ADMIN,
        scopes: [
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
          Scope.TENANTS,
          Scope.VENDORS,
          Scope.INVOICES,
          Scope.PURCHASE_ORDERS,
          Scope.SALES_ORDERS,
        ],
      },
      {
        name: RoleEnum.USER,
        scopes: [Scope.VENDORS, Scope.INVOICES, Scope.PURCHASE_ORDERS, Scope.SALES_ORDERS],
      },
    ];

    for (const role of roles) {
      const exists = await this.roleModel.findOne({ name: role.name });
      if (exists) {
        console.log(`   ⚠️  Role '${role.name}' already exists`);
        continue;
      }
      await this.roleModel.create({
        name: role.name,
        scopes: role.scopes,
        createdBy: 'system',
        updatedBy: 'system',
      });
      console.log(`   ✅ Created role '${role.name}'`);
    }
  }

  private async seedAdminUsers(): Promise<void> {
    console.log('👤 Seeding admin users...');

    const users = [
      {
        username: 'admin@company.com',
        password: 'Admin123!',
        roles: [RoleEnum.ADMIN],
      },
      {
        username: 'manager@company.com',
        password: 'Manager123!',
        roles: [RoleEnum.MANAGER],
      },
    ];

    for (const userConfig of users) {
      const exists = await this.userModel.findOne({ username: userConfig.username });
      if (exists) {
        console.log(`   ⚠️  User '${userConfig.username}' already exists`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(userConfig.password, 10);
      await this.userModel.create({
        username: userConfig.username,
        password: hashedPassword,
        roles: userConfig.roles,
        tenantId: this.DEFAULT_TENANT_ID,
        createdBy: 'system',
        updatedBy: 'system',
      });
      console.log(`   ✅ Created user '${userConfig.username}'`);
    }
  }

  private async seedTaxes(): Promise<void> {
    console.log('💰 Seeding tax configurations...');

    const taxes = [
      { tax_code: 'GST-5', name: 'GST 5%', rate: 5, applicable_on: 'both' },
      { tax_code: 'GST-12', name: 'GST 12%', rate: 12, applicable_on: 'both' },
      { tax_code: 'GST-18', name: 'GST 18%', rate: 18, applicable_on: 'both' },
      { tax_code: 'GST-28', name: 'GST 28%', rate: 28, applicable_on: 'both' },
      { tax_code: 'NO-TAX', name: 'No Tax', rate: 0, applicable_on: 'both' },
    ];

    for (const tax of taxes) {
      const exists = await this.taxModel.findOne({ tax_code: tax.tax_code });
      if (exists) {
        console.log(`   ⚠️  Tax '${tax.tax_code}' already exists`);
        continue;
      }
      await this.taxModel.create({
        ...tax,
        description: tax.name,
        rate_type: 'percentage',
        status: 'active',
        jurisdiction: 'India',
        tax_category: 'GST',
        priority: 1,
        is_inclusive: false,
        is_compound: false,
        createdBy: 'system',
        updatedBy: 'system',
      });
      console.log(`   ✅ Created tax '${tax.tax_code}'`);
    }
  }

  private async seedRooms(): Promise<void> {
    console.log('🛏  Seeding rooms...');

    const rooms = [
      // ICU
      {
        room_number: 'ICU-01',
        floor: 1,
        type: 'icu',
        bed_capacity: 2,
        daily_rate: 10000,
        department: 'Emergency',
        amenities: ['Ventilator', 'Cardiac Monitor'],
      },
      {
        room_number: 'ICU-02',
        floor: 1,
        type: 'icu',
        bed_capacity: 2,
        daily_rate: 10000,
        department: 'Emergency',
        amenities: ['Ventilator', 'Cardiac Monitor'],
      },

      // General Ward
      {
        room_number: 'GW-101',
        floor: 1,
        type: 'general',
        bed_capacity: 4,
        daily_rate: 1500,
        department: 'General Medicine',
        amenities: ['Call Bell', 'Fan'],
      },
      {
        room_number: 'GW-102',
        floor: 1,
        type: 'general',
        bed_capacity: 4,
        daily_rate: 1500,
        department: 'Cardiology',
        amenities: ['Call Bell', 'Fan'],
      },
      {
        room_number: 'GW-201',
        floor: 2,
        type: 'general',
        bed_capacity: 4,
        daily_rate: 1500,
        department: 'Orthopaedics',
        amenities: ['Call Bell', 'Fan'],
      },

      // Semi-Private
      {
        room_number: 'SP-301',
        floor: 3,
        type: 'semi_private',
        bed_capacity: 2,
        daily_rate: 3000,
        department: 'Cardiology',
        amenities: ['AC', 'TV', 'Call Bell'],
      },
      {
        room_number: 'SP-302',
        floor: 3,
        type: 'semi_private',
        bed_capacity: 2,
        daily_rate: 3000,
        department: 'Neurology',
        amenities: ['AC', 'TV', 'Call Bell'],
      },

      // Private
      {
        room_number: 'PR-401',
        floor: 4,
        type: 'private',
        bed_capacity: 1,
        daily_rate: 5000,
        department: 'Cardiology',
        amenities: ['AC', 'TV', 'Attached Bath', 'Wi-Fi'],
      },
      {
        room_number: 'PR-402',
        floor: 4,
        type: 'private',
        bed_capacity: 1,
        daily_rate: 5000,
        department: 'Oncology',
        amenities: ['AC', 'TV', 'Attached Bath', 'Wi-Fi'],
      },

      // Deluxe
      {
        room_number: 'DX-501',
        floor: 5,
        type: 'deluxe',
        bed_capacity: 1,
        daily_rate: 8000,
        department: 'VIP',
        amenities: ['AC', 'Jacuzzi', 'LCD TV', 'Lounge Area', 'Wi-Fi'],
      },
    ];

    let count = 0;
    for (const room of rooms) {
      const exists = await this.roomModel.findOne({
        tenantId: this.DEFAULT_TENANT_ID,
        room_number: room.room_number,
      });
      if (exists) {
        console.log(`   ⚠️  Room '${room.room_number}' already exists`);
        continue;
      }
      await this.roomModel.create({
        ...room,
        status: 'available',
        tenantId: this.DEFAULT_TENANT_ID,
        createdBy: 'system',
        updatedBy: 'system',
      });
      count++;
    }
    console.log(`   ✅ Created ${count} rooms`);
  }

  private async seedDoctors(): Promise<void> {
    console.log('🩺 Seeding doctors...');

    const weekdaySchedule = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => ({
      day,
      start_time: '09:00',
      end_time: '17:00',
    }));

    const doctors = [
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
      },
    ];

    let count = 0;
    for (const doctor of doctors) {
      const exists = await this.doctorModel.findOne({
        tenantId: this.DEFAULT_TENANT_ID,
        employee_id: doctor.employee_id,
      });
      if (exists) {
        console.log(`   ⚠️  Doctor '${doctor.employee_id}' already exists`);
        continue;
      }
      await this.doctorModel.create({
        ...doctor,
        tenantId: this.DEFAULT_TENANT_ID,
        createdBy: 'system',
        updatedBy: 'system',
      });
      count++;
    }
    console.log(`   ✅ Created ${count} doctors`);
  }

  private async seedMedications(): Promise<void> {
    console.log('💊 Seeding medications...');

    const medications = [
      {
        drug_code: 'MED-001',
        name: 'Paracetamol IP 500mg',
        generic_name: 'Paracetamol',
        dosage_form: 'tablet',
        strength: '500mg',
        price_per_unit: 1.5,
        stock_quantity: 500,
        manufacturer: 'Cipla',
        category: 'Analgesic',
        is_active: true,
      },
      {
        drug_code: 'MED-002',
        name: 'Ibuprofen IP 400mg',
        generic_name: 'Ibuprofen',
        dosage_form: 'tablet',
        strength: '400mg',
        price_per_unit: 3.0,
        stock_quantity: 400,
        manufacturer: 'Sun Pharma',
        category: 'Anti-inflammatory',
        is_active: true,
      },
      {
        drug_code: 'MED-003',
        name: 'Amoxicillin IP 500mg',
        generic_name: 'Amoxicillin',
        dosage_form: 'capsule',
        strength: '500mg',
        price_per_unit: 8.0,
        stock_quantity: 400,
        manufacturer: 'Cipla',
        category: 'Antibiotic',
        is_active: true,
      },
      {
        drug_code: 'MED-004',
        name: 'Omeprazole IP 20mg',
        generic_name: 'Omeprazole',
        dosage_form: 'capsule',
        strength: '20mg',
        price_per_unit: 6.0,
        stock_quantity: 400,
        manufacturer: 'Sun Pharma',
        category: 'Antacid',
        is_active: true,
      },
      {
        drug_code: 'MED-005',
        name: 'Amlodipine IP 5mg',
        generic_name: 'Amlodipine',
        dosage_form: 'tablet',
        strength: '5mg',
        price_per_unit: 5.0,
        stock_quantity: 400,
        manufacturer: 'Pfizer',
        category: 'Cardiac',
        is_active: true,
      },
      {
        drug_code: 'MED-006',
        name: 'Metformin HCl 500mg',
        generic_name: 'Metformin',
        dosage_form: 'tablet',
        strength: '500mg',
        price_per_unit: 3.0,
        stock_quantity: 500,
        manufacturer: 'Sun Pharma',
        category: 'Antidiabetic',
        is_active: true,
      },
    ];

    let count = 0;
    for (const med of medications) {
      const exists = await this.medicationModel.findOne({
        tenantId: this.DEFAULT_TENANT_ID,
        drug_code: med.drug_code,
      });
      if (exists) {
        console.log(`   ⚠️  Medication '${med.drug_code}' already exists`);
        continue;
      }
      await this.medicationModel.create({
        ...med,
        tenantId: this.DEFAULT_TENANT_ID,
        createdBy: 'system',
        updatedBy: 'system',
      });
      count++;
    }
    console.log(`   ✅ Created ${count} medications`);
  }

  private async seedVendors(): Promise<void> {
    console.log('🏭 Seeding vendors...');

    const vendors = [
      {
        vendor_code: 'VEN-001',
        name: 'Cipla Limited',
        legal_name: 'Cipla Limited',
        tax_id: 'GST12AB1234K1Z5',
        address: 'Mumbai, Maharashtra',
        payment_terms: 'Net 30',
        default_lead_time_days: 5,
      },
      {
        vendor_code: 'VEN-002',
        name: 'Sun Pharmaceuticals',
        legal_name: 'Sun Pharmaceutical Industries Ltd',
        tax_id: 'GST17AB5678K1Z5',
        address: 'Pune, Maharashtra',
        payment_terms: 'Net 30',
        default_lead_time_days: 3,
      },
      {
        vendor_code: 'VEN-003',
        name: 'Dr. Reddy\'s Laboratories',
        legal_name: 'Dr. Reddy\'s Laboratories Limited',
        tax_id: 'GST07AB9012K1Z5',
        address: 'Hyderabad, Telangana',
        payment_terms: 'Net 45',
        default_lead_time_days: 7,
      },
      {
        vendor_code: 'VEN-004',
        name: 'Pfizer India',
        legal_name: 'Pfizer Limited',
        tax_id: 'GST27AB3456K1Z5',
        address: 'Delhi, Delhi',
        payment_terms: 'Net 30',
        default_lead_time_days: 4,
      },
    ];

    let count = 0;
    for (const vendor of vendors) {
      const exists = await this.vendorModel.findOne({
        tenantId: this.DEFAULT_TENANT_ID,
        vendor_code: vendor.vendor_code,
      });
      if (exists) {
        console.log(`   ⚠️  Vendor '${vendor.vendor_code}' already exists`);
        continue;
      }
      await this.vendorModel.create({
        ...vendor,
        tenantId: this.DEFAULT_TENANT_ID,
        createdBy: 'system',
        updatedBy: 'system',
      });
      count++;
    }
    console.log(`   ✅ Created ${count} vendors`);
  }

  private async seedPatients(): Promise<void> {
    console.log('🧑‍⚕️ Seeding sample patients...');

    const patients = [
      {
        patient_id: 'PAT-001',
        first_name: 'John',
        last_name: 'Doe',
        gender: 'Male',
        dob: '1980-05-15',
        blood_group: 'O+',
        status: 'active',
        department: 'General Medicine',
      },
      {
        patient_id: 'PAT-002',
        first_name: 'Jane',
        last_name: 'Smith',
        gender: 'Female',
        dob: '1985-08-20',
        blood_group: 'A+',
        status: 'active',
        department: 'Cardiology',
      },
      {
        patient_id: 'PAT-003',
        first_name: 'Robert',
        last_name: 'Johnson',
        gender: 'Male',
        dob: '1975-03-10',
        blood_group: 'B+',
        status: 'active',
        department: 'Orthopaedics',
      },
    ];

    let count = 0;
    for (const patient of patients) {
      const exists = await this.patientModel.findOne({
        tenantId: this.DEFAULT_TENANT_ID,
        patient_id: patient.patient_id,
      });
      if (exists) {
        console.log(`   ⚠️  Patient '${patient.patient_id}' already exists`);
        continue;
      }
      await this.patientModel.create({
        ...patient,
        tenantId: this.DEFAULT_TENANT_ID,
        createdBy: 'system',
        updatedBy: 'system',
      });
      count++;
    }
    console.log(`   ✅ Created ${count} patients`);
  }
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const seeder = new ComprehensiveSeeder(
      app.get<Model<UserDocument>>(getModelToken(User.name)),
      app.get<Model<RoleDocument>>(getModelToken(Role.name)),
      app.get<Model<TaxDocument>>(getModelToken(Tax.name)),
      app.get<Model<RoomDocument>>(getModelToken(Room.name)),
      app.get<Model<DoctorDocument>>(getModelToken(Doctor.name)),
      app.get<Model<MedicationDocument>>(getModelToken(Medication.name)),
      app.get<Model<VendorDocument>>(getModelToken(Vendor.name)),
      app.get<Model<PatientDocument>>(getModelToken(Patient.name)),
      app.get<Model<TenantDocument>>(getModelToken(Tenant.name)),
    );

    await seeder.seedAll();
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
