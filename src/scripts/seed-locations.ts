import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

const LOCATIONS = [
  {
    name: 'Main Pharmacy',
    code: 'LOC-PHARM-01',
    type: 'pharmacy',
    address: 'Building A, Ground Floor',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    contact_person: 'Rajesh Verma',
    phone: '+91-9876543210',
    email: 'pharmacy@hospital.com',
    is_active: true,
    sub_locations: [
      { name: 'Shelf A1', type: 'shelf', capacity: 200 },
      { name: 'Shelf A2', type: 'shelf', capacity: 200 },
      { name: 'Shelf B1', type: 'shelf', capacity: 150 },
      { name: 'Drawer C1', type: 'drawer', capacity: 50 },
      { name: 'Drawer C2', type: 'drawer', capacity: 50 },
      { name: 'Rack D1', type: 'rack', capacity: 500 },
    ],
  },
  {
    name: 'Warehouse A',
    code: 'LOC-WH-01',
    type: 'warehouse',
    address: 'Building C, Basement',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    contact_person: 'Amit Patel',
    phone: '+91-9876543211',
    email: 'warehouse@hospital.com',
    is_active: true,
    sub_locations: [
      { name: 'Rack 1', type: 'rack', capacity: 1000 },
      { name: 'Rack 2', type: 'rack', capacity: 1000 },
      { name: 'Rack 3', type: 'rack', capacity: 1000 },
      { name: 'Bin A', type: 'bin', capacity: 300 },
      { name: 'Bin B', type: 'bin', capacity: 300 },
    ],
  },
  {
    name: 'Emergency Store',
    code: 'LOC-ER-01',
    type: 'store',
    address: 'Building A, 1st Floor, ER Wing',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    contact_person: 'Dr. Priya Singh',
    phone: '+91-9876543212',
    email: 'er-store@hospital.com',
    is_active: true,
    sub_locations: [
      { name: 'Emergency Shelf 1', type: 'shelf', capacity: 100 },
      { name: 'Emergency Shelf 2', type: 'shelf', capacity: 100 },
      { name: 'Crash Cart Drawer', type: 'drawer', capacity: 30 },
    ],
  },
  {
    name: 'OPD Clinic Store',
    code: 'LOC-OPD-01',
    type: 'clinic',
    address: 'Building B, Ground Floor',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    contact_person: 'Sunita Sharma',
    phone: '+91-9876543213',
    email: 'opd@hospital.com',
    is_active: true,
    sub_locations: [
      { name: 'Shelf 1', type: 'shelf', capacity: 80 },
      { name: 'Drawer 1', type: 'drawer', capacity: 30 },
    ],
  },
  {
    name: 'IPD Ward Store',
    code: 'LOC-IPD-01',
    type: 'hospital',
    address: 'Building A, 2nd Floor',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    contact_person: 'Nurse Meena',
    phone: '+91-9876543214',
    email: 'ipd-store@hospital.com',
    is_active: true,
    sub_locations: [
      { name: 'Ward Shelf A', type: 'shelf', capacity: 60 },
      { name: 'Ward Shelf B', type: 'shelf', capacity: 60 },
      { name: 'Medication Drawer', type: 'drawer', capacity: 40 },
    ],
  },
];

async function seedLocations() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const locationModel = app.get<Model<any>>(getModelToken('Location'));
    const tenantId = 'default_tenant';

    for (const loc of LOCATIONS) {
      const exists = await locationModel.findOne({ code: loc.code, tenantId }).exec();
      if (exists) {
        console.log(`  ⏭  Location "${loc.name}" already exists, skipping`);
        continue;
      }
      await locationModel.create({
        ...loc,
        tenantId,
        createdBy: 'seed-script',
        updatedBy: 'seed-script',
      });
      console.log(`  ✅ Created location: ${loc.name} (${loc.code}) — ${loc.sub_locations.length} sub-locations`);
    }

    console.log('\n✅ Location seed complete');
  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await app.close();
  }
}

seedLocations();
