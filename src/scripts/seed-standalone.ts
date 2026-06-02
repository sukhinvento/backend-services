import { MongoClient } from 'mongodb';
import * as bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';

const MONGO_URI = 'mongodb://root:rootpassword@localhost:27017/medsystem?authSource=admin';
const DEFAULT_TENANT_ID = 'default_tenant';
const PHARMA_TENANT_ID = 'pharma_inc';

async function seedDatabase() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    const db = client.db('medsystem');
    console.log('✓ Connected to MongoDB');

    // Seed Tenants
    console.log('\n📋 Seeding Tenants...');
    const tenantCollection = db.collection('tenants') as any;
    const tenants: any[] = [
      { _id: DEFAULT_TENANT_ID, name: 'Default Tenant', slug: 'default', is_active: true },
      { _id: PHARMA_TENANT_ID, name: 'Pharma Inc', slug: 'pharma-inc', is_active: true },
    ];
    for (const tenant of tenants) {
      const existing = await tenantCollection.findOne({ _id: tenant._id });
      if (!existing) {
        await tenantCollection.insertOne(tenant);
        console.log(`  ✓ ${tenant.name}`);
      }
    }

    // Seed Roles
    console.log('\n👥 Seeding Roles...');
    const roleCollection = db.collection('roles') as any;
    const roles: any[] = [
      {
        _id: new ObjectId(),
        name: 'admin',
        scopes: [
          'vendors', 'tenants', 'invoices', 'purchase-orders', 'sales-orders',
          'user-management', 'system-admin', 'patients', 'doctors', 'rooms',
          'admissions', 'diagnostics', 'medications', 'hospital-billing', 'inventory'
        ],
        tenantId: DEFAULT_TENANT_ID,
      },
      {
        _id: new ObjectId(),
        name: 'manager',
        scopes: [
          'vendors', 'invoices', 'purchase-orders', 'sales-orders',
          'patients', 'doctors', 'rooms', 'admissions', 'diagnostics',
          'medications', 'hospital-billing', 'inventory'
        ],
        tenantId: DEFAULT_TENANT_ID,
      },
      {
        _id: new ObjectId(),
        name: 'user',
        scopes: [
          'vendors', 'purchase-orders', 'sales-orders',
          'patients', 'admissions', 'diagnostics', 'inventory'
        ],
        tenantId: DEFAULT_TENANT_ID,
      },
      {
        _id: new ObjectId(),
        name: 'viewer',
        scopes: [
          'vendors', 'purchase-orders', 'sales-orders',
          'patients', 'admissions', 'diagnostics', 'inventory'
        ],
        tenantId: DEFAULT_TENANT_ID,
      },
      {
        _id: new ObjectId(),
        name: 'doctor',
        scopes: ['patients', 'admissions', 'diagnostics', 'medications', 'doctors'],
        tenantId: DEFAULT_TENANT_ID,
      },
      {
        _id: new ObjectId(),
        name: 'billing_staff',
        scopes: ['invoices', 'hospital-billing', 'patients', 'admissions'],
        tenantId: DEFAULT_TENANT_ID,
      },
      {
        _id: new ObjectId(),
        name: 'receptionist',
        scopes: ['patients', 'admissions', 'rooms', 'doctors'],
        tenantId: DEFAULT_TENANT_ID,
      },
    ];
    for (const role of roles) {
      const existing = await roleCollection.findOne({ name: role.name, tenantId: role.tenantId });
      if (!existing) {
        await roleCollection.insertOne(role);
        console.log(`  ✓ ${role.name}`);
      }
    }

    // Seed Users
    console.log('\n👤 Seeding Users...');
    const userCollection = db.collection('users') as any;
    const users: any[] = [
      {
        username: 'admin',
        email: 'admin@company.com',
        password_hash: await bcrypt.hash('Admin123!', 10),
        first_name: 'Admin',
        last_name: 'User',
        roles: ['admin'],
        tenantId: DEFAULT_TENANT_ID,
        is_active: true,
      },
      {
        username: 'manager',
        email: 'manager@company.com',
        password_hash: await bcrypt.hash('Manager123!', 10),
        first_name: 'Manager',
        last_name: 'User',
        roles: ['manager'],
        tenantId: DEFAULT_TENANT_ID,
        is_active: true,
      },
    ];
    for (const user of users) {
      const existing = await userCollection.findOne({ email: user.email });
      if (!existing) {
        await userCollection.insertOne(user);
        console.log(`  ✓ ${user.email}`);
      }
    }

    // Seed Tax Configurations
    console.log('\n💰 Seeding Tax Configurations...');
    const taxCollection = db.collection('taxes') as any;
    const taxes: any[] = [
      { _id: new ObjectId(), tax_code: 'GST5', tax_name: 'GST 5%', rate: 5, tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), tax_code: 'GST12', tax_name: 'GST 12%', rate: 12, tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), tax_code: 'GST18', tax_name: 'GST 18%', rate: 18, tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), tax_code: 'GST28', tax_name: 'GST 28%', rate: 28, tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), tax_code: 'NOTAX', tax_name: 'No Tax', rate: 0, tenantId: DEFAULT_TENANT_ID },
    ];
    for (const tax of taxes) {
      const existing = await taxCollection.findOne({ tax_code: tax.tax_code });
      if (!existing) {
        await taxCollection.insertOne(tax);
        console.log(`  ✓ ${tax.tax_name}`);
      }
    }

    // Seed Rooms
    console.log('\n🏥 Seeding Rooms...');
    const roomCollection = db.collection('rooms') as any;
    const roomTypes = ['General', 'Semi-Private', 'Private', 'ICU', 'NICU'];
    let roomNumber = 101;
    for (const type of roomTypes) {
      for (let i = 0; i < 2; i++) {
        const room: any = {
          _id: new ObjectId(),
          room_number: `${roomNumber}`,
          room_type: type,
          capacity: type === 'ICU' ? 1 : type === 'Private' ? 1 : type === 'Semi-Private' ? 2 : 4,
          is_available: true,
          tenantId: DEFAULT_TENANT_ID,
        };
        const existing = await roomCollection.findOne({ room_number: room.room_number, tenantId: room.tenantId });
        if (!existing) {
          await roomCollection.insertOne(room);
          console.log(`  ✓ Room ${room.room_number} (${room.room_type})`);
        }
        roomNumber++;
      }
    }

    // Seed Doctors
    console.log('\n👨‍⚕️ Seeding Doctors...');
    const doctorCollection = db.collection('doctors') as any;
    const doctors: any[] = [
      {
        _id: new ObjectId(),
        employee_id: 'EMP001',
        name: 'Dr. John Smith',
        department: 'Cardiology',
        specialisation: 'Cardiology',
        phone: '9876543220',
        email: 'john.smith@hospital.com',
        status: 'active',
        registration_no: 'REG001',
        consultation_fee: 500,
        tenantId: DEFAULT_TENANT_ID,
      },
      {
        _id: new ObjectId(),
        employee_id: 'EMP002',
        name: 'Dr. Sarah Johnson',
        department: 'Orthopedics',
        specialisation: 'Orthopedics',
        phone: '9876543221',
        email: 'sarah.johnson@hospital.com',
        status: 'active',
        registration_no: 'REG002',
        consultation_fee: 600,
        tenantId: DEFAULT_TENANT_ID,
      },
      {
        _id: new ObjectId(),
        employee_id: 'EMP003',
        name: 'Dr. Michael Brown',
        department: 'Pediatrics',
        specialisation: 'Pediatrics',
        phone: '9876543222',
        email: 'michael.brown@hospital.com',
        status: 'active',
        registration_no: 'REG003',
        consultation_fee: 450,
        tenantId: DEFAULT_TENANT_ID,
      },
      {
        _id: new ObjectId(),
        employee_id: 'EMP004',
        name: 'Dr. Emily Davis',
        department: 'Neurology',
        specialisation: 'Neurology',
        phone: '9876543223',
        email: 'emily.davis@hospital.com',
        status: 'active',
        registration_no: 'REG004',
        consultation_fee: 700,
        tenantId: DEFAULT_TENANT_ID,
      },
    ];
    for (const doctor of doctors) {
      const existing = await doctorCollection.findOne({ employee_id: doctor.employee_id, tenantId: doctor.tenantId });
      if (!existing) {
        await doctorCollection.insertOne(doctor);
        console.log(`  ✓ ${doctor.name} (${doctor.specialisation})`);
      }
    }

    // Seed Medications - Indian Generic Medicines
    console.log('\n💊 Seeding Medications...');
    const medicationCollection = db.collection('medications') as any;
    const medications: any[] = [
      // Antibiotics
      { _id: new ObjectId(), drug_code: 'AMOX001', generic_name: 'Amoxicillin', brand_name: 'Amoxil', dosage: '250mg', stock_quantity: 600, unit_price: 25, manufacturer: 'GSK', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'AMOX002', generic_name: 'Amoxicillin', brand_name: 'Amoxyvet', dosage: '500mg', stock_quantity: 500, unit_price: 35, manufacturer: 'Cipla', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'AZTH001', generic_name: 'Azithromycin', brand_name: 'Azitrom', dosage: '250mg', stock_quantity: 400, unit_price: 45, manufacturer: 'Lupin', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'CEPH001', generic_name: 'Cephalexin', brand_name: 'Ceporex', dosage: '250mg', stock_quantity: 350, unit_price: 40, manufacturer: 'Eli Lilly', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'CIPR001', generic_name: 'Ciprofloxacin', brand_name: 'Cipro', dosage: '500mg', stock_quantity: 400, unit_price: 30, manufacturer: 'Bayer', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'LEVO001', generic_name: 'Levofloxacin', brand_name: 'Levoquin', dosage: '500mg', stock_quantity: 300, unit_price: 50, manufacturer: 'Daiichi Sankyo', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'DOXY001', generic_name: 'Doxycycline', brand_name: 'Vibramycin', dosage: '100mg', stock_quantity: 500, unit_price: 35, manufacturer: 'Pfizer', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'TRIM001', generic_name: 'Trimethoprim-Sulfamethoxazole', brand_name: 'Bactrim', dosage: '400mg', stock_quantity: 250, unit_price: 28, manufacturer: 'Roche', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },

      // Pain & Fever
      { _id: new ObjectId(), drug_code: 'PARA001', generic_name: 'Paracetamol', brand_name: 'Crocin', dosage: '500mg', stock_quantity: 1200, unit_price: 10, manufacturer: 'GlaxoSmithKline', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'IBUP001', generic_name: 'Ibuprofen', brand_name: 'Brufen', dosage: '200mg', stock_quantity: 900, unit_price: 15, manufacturer: 'Abbott', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'IBUP002', generic_name: 'Ibuprofen', brand_name: 'Combiflam', dosage: '400mg', stock_quantity: 700, unit_price: 20, manufacturer: 'Sanofi', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'NAPR001', generic_name: 'Naproxen', brand_name: 'Naprosyn', dosage: '250mg', stock_quantity: 400, unit_price: 22, manufacturer: 'Roche', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'ASPR001', generic_name: 'Aspirin', brand_name: 'Ecosprin', dosage: '75mg', stock_quantity: 1500, unit_price: 8, manufacturer: 'USV', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'ASPR002', generic_name: 'Aspirin', brand_name: 'Disprin', dosage: '325mg', stock_quantity: 800, unit_price: 12, manufacturer: 'Reckitt', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },

      // Antihistamines & Allergy
      { _id: new ObjectId(), drug_code: 'CETI001', generic_name: 'Cetirizine', brand_name: 'Allegra', dosage: '10mg', stock_quantity: 600, unit_price: 18, manufacturer: 'Sanofi', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'LORA001', generic_name: 'Loratadine', brand_name: 'Clarityn', dosage: '10mg', stock_quantity: 500, unit_price: 20, manufacturer: 'Schering Plough', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'FEXA001', generic_name: 'Fexofenadine', brand_name: 'Allegra', dosage: '120mg', stock_quantity: 400, unit_price: 28, manufacturer: 'Sanofi', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'DESL001', generic_name: 'Desloratadine', brand_name: 'Aerius', dosage: '5mg', stock_quantity: 350, unit_price: 35, manufacturer: 'Schering Plough', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },

      // GI & Digestive
      { _id: new ObjectId(), drug_code: 'OMEP001', generic_name: 'Omeprazole', brand_name: 'Losec', dosage: '20mg', stock_quantity: 1000, unit_price: 12, manufacturer: 'AstraZeneca', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'RANI001', generic_name: 'Ranitidine', brand_name: 'Zantac', dosage: '150mg', stock_quantity: 800, unit_price: 10, manufacturer: 'GlaxoSmithKline', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'ONDA001', generic_name: 'Ondansetron', brand_name: 'Zofran', dosage: '4mg', stock_quantity: 500, unit_price: 25, manufacturer: 'GlaxoSmithKline', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'DOMP001', generic_name: 'Domperidone', brand_name: 'Motilium', dosage: '10mg', stock_quantity: 600, unit_price: 8, manufacturer: 'Janssen', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'METRO001', generic_name: 'Metoclopramide', brand_name: 'Reglan', dosage: '10mg', stock_quantity: 400, unit_price: 5, manufacturer: 'Wyeth', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },

      // Antidiabetic
      { _id: new ObjectId(), drug_code: 'METF001', generic_name: 'Metformin', brand_name: 'Glucophage', dosage: '500mg', stock_quantity: 2000, unit_price: 5, manufacturer: 'Merck', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'GLIB001', generic_name: 'Glibenclamide', brand_name: 'Daonil', dosage: '5mg', stock_quantity: 800, unit_price: 8, manufacturer: 'Aventis', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'GLIP001', generic_name: 'Glipizide', brand_name: 'Glucotrol', dosage: '5mg', stock_quantity: 600, unit_price: 12, manufacturer: 'Pfizer', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'PPIO001', generic_name: 'Pioglitazone', brand_name: 'Actos', dosage: '15mg', stock_quantity: 400, unit_price: 30, manufacturer: 'Takeda', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },

      // Cardiovascular
      { _id: new ObjectId(), drug_code: 'ENAL001', generic_name: 'Enalapril', brand_name: 'Enacard', dosage: '5mg', stock_quantity: 1000, unit_price: 8, manufacturer: 'Merck', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'ATEN001', generic_name: 'Atenolol', brand_name: 'Tenormin', dosage: '50mg', stock_quantity: 900, unit_price: 6, manufacturer: 'AstraZeneca', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'AMLO001', generic_name: 'Amlodipine', brand_name: 'Norvasc', dosage: '5mg', stock_quantity: 1200, unit_price: 12, manufacturer: 'Pfizer', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'SIMV001', generic_name: 'Simvastatin', brand_name: 'Zocor', dosage: '20mg', stock_quantity: 800, unit_price: 15, manufacturer: 'Merck', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'ATOR001', generic_name: 'Atorvastatin', brand_name: 'Lipitor', dosage: '10mg', stock_quantity: 1000, unit_price: 18, manufacturer: 'Pfizer', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'FURO001', generic_name: 'Furosemide', brand_name: 'Lasix', dosage: '40mg', stock_quantity: 600, unit_price: 5, manufacturer: 'Sanofi', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },

      // Respiratory
      { _id: new ObjectId(), drug_code: 'SALB001', generic_name: 'Salbutamol', brand_name: 'Ventolin', dosage: '2mg', stock_quantity: 500, unit_price: 20, manufacturer: 'GlaxoSmithKline', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'TERB001', generic_name: 'Terbutaline', brand_name: 'Bricanyl', dosage: '2.5mg', stock_quantity: 400, unit_price: 18, manufacturer: 'AstraZeneca', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'MONT001', generic_name: 'Montelukast', brand_name: 'Singulair', dosage: '4mg', stock_quantity: 350, unit_price: 35, manufacturer: 'Merck', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'AMBE001', generic_name: 'Ambroxol', brand_name: 'Mucosolvan', dosage: '30mg', stock_quantity: 600, unit_price: 10, manufacturer: 'Boehringer', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },

      // Muscle Relaxants & NSAIDs
      { _id: new ObjectId(), drug_code: 'CHLO001', generic_name: 'Chlorzoxazone', brand_name: 'Flexon', dosage: '250mg', stock_quantity: 400, unit_price: 8, manufacturer: 'Merck', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'METH001', generic_name: 'Methocarbamol', brand_name: 'Robaxin', dosage: '500mg', stock_quantity: 300, unit_price: 12, manufacturer: 'Endo', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },

      // Antibiotic Combinations
      { _id: new ObjectId(), drug_code: 'AMOX003', generic_name: 'Amoxicillin + Clavulanic Acid', brand_name: 'Augmentin', dosage: '625mg', stock_quantity: 500, unit_price: 45, manufacturer: 'GlaxoSmithKline', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },

      // Vitamins & Supplements
      { _id: new ObjectId(), drug_code: 'VITB001', generic_name: 'Vitamin B Complex', brand_name: 'Neurobion', dosage: '1mg', stock_quantity: 800, unit_price: 5, manufacturer: 'Merck', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'VITC001', generic_name: 'Vitamin C', brand_name: 'Celin', dosage: '500mg', stock_quantity: 1000, unit_price: 4, manufacturer: 'Abbott', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'VITE001', generic_name: 'Vitamin E', brand_name: 'Evion', dosage: '400IU', stock_quantity: 600, unit_price: 8, manufacturer: 'Merck', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
      { _id: new ObjectId(), drug_code: 'CALC001', generic_name: 'Calcium Carbonate', brand_name: 'Caltrate', dosage: '500mg', stock_quantity: 900, unit_price: 6, manufacturer: 'Pfizer', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },

      // Thyroid & Hormones
      { _id: new ObjectId(), drug_code: 'LEVU001', generic_name: 'Levothyroxine', brand_name: 'Eltroxin', dosage: '50mcg', stock_quantity: 700, unit_price: 10, manufacturer: 'GlaxoSmithKline', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },

      // Antispasmodics
      { _id: new ObjectId(), drug_code: 'SPAS001', generic_name: 'Dicyclomine', brand_name: 'Merbentyl', dosage: '10mg', stock_quantity: 500, unit_price: 8, manufacturer: 'Merck', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },

      // Decongestants
      { _id: new ObjectId(), drug_code: 'PSEU001', generic_name: 'Pseudoephedrine', brand_name: 'Sudafed', dosage: '30mg', stock_quantity: 400, unit_price: 8, manufacturer: 'Janssen', expiry_date: new Date('2027-12-31'), tenantId: DEFAULT_TENANT_ID },
    ];
    for (const med of medications) {
      const existing = await medicationCollection.findOne({ drug_code: med.drug_code });
      if (!existing) {
        await medicationCollection.insertOne(med);
        console.log(`  ✓ ${med.generic_name} (${med.brand_name})`);
      }
    }

    // Seed Vendors
    console.log('\n🏢 Seeding Vendors...');
    const vendorCollection = db.collection('vendors') as any;
    const vendors: any[] = [
      {
        _id: new ObjectId(),
        vendor_code: 'VND001',
        vendor_name: 'PharmaCorp Inc',
        contact_person: 'John Doe',
        email: 'contact@pharmacorp.com',
        phone: '9876543210',
        address: '123 Pharma Street, City',
        status: 'active',
        payment_terms: 'NET 30',
      },
      {
        _id: new ObjectId(),
        vendor_code: 'VND002',
        vendor_name: 'MediSupply Ltd',
        contact_person: 'Jane Smith',
        email: 'sales@medisupply.com',
        phone: '9876543211',
        address: '456 Medical Ave, City',
        status: 'active',
        payment_terms: 'NET 30',
      },
      {
        _id: new ObjectId(),
        vendor_code: 'VND003',
        vendor_name: 'HealthCare Distributors',
        contact_person: 'Robert Wilson',
        email: 'orders@healthdist.com',
        phone: '9876543212',
        address: '789 Health Blvd, City',
        status: 'active',
        payment_terms: 'NET 30',
      },
      {
        _id: new ObjectId(),
        vendor_code: 'VND004',
        vendor_name: 'Global Pharma Solutions',
        contact_person: 'Lisa Anderson',
        email: 'sales@globalpharm.com',
        phone: '9876543213',
        address: '321 Global Way, City',
        status: 'active',
        payment_terms: 'NET 30',
      },
    ];
    for (const vendor of vendors) {
      const existing = await vendorCollection.findOne({ vendor_code: vendor.vendor_code });
      if (!existing) {
        await vendorCollection.insertOne(vendor);
        console.log(`  ✓ ${vendor.vendor_name}`);
      }
    }

    // Seed Patients
    console.log('\n🚑 Seeding Patients...');
    const patientCollection = db.collection('patients') as any;
    const patients: any[] = [
      {
        _id: new ObjectId(),
        patient_id: 'PAT001',
        first_name: 'Rajesh',
        last_name: 'Kumar',
        date_of_birth: new Date('1980-05-15'),
        gender: 'M',
        phone: '9876543214',
        email: 'rajesh@example.com',
        address: '123 Main St, City',
        status: 'active',
        tenantId: DEFAULT_TENANT_ID,
      },
      {
        _id: new ObjectId(),
        patient_id: 'PAT002',
        first_name: 'Priya',
        last_name: 'Singh',
        date_of_birth: new Date('1990-08-22'),
        gender: 'F',
        phone: '9876543215',
        email: 'priya@example.com',
        address: '456 Oak Ave, City',
        status: 'active',
        tenantId: DEFAULT_TENANT_ID,
      },
      {
        _id: new ObjectId(),
        patient_id: 'PAT003',
        first_name: 'Arun',
        last_name: 'Patel',
        date_of_birth: new Date('1975-12-10'),
        gender: 'M',
        phone: '9876543216',
        email: 'arun@example.com',
        address: '789 Pine Rd, City',
        status: 'active',
        tenantId: DEFAULT_TENANT_ID,
      },
    ];
    for (const patient of patients) {
      const existing = await patientCollection.findOne({ patient_id: patient.patient_id });
      if (!existing) {
        await patientCollection.insertOne(patient);
        console.log(`  ✓ ${patient.first_name} ${patient.last_name}`);
      }
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('   Email: admin@company.com');
    console.log('   Password: Admin123!');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

seedDatabase();
