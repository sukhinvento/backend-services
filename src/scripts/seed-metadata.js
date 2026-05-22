/**
 * Seed script: Hospital Metadata
 * Seeds: Rooms, Diagnostic Tests, Medications
 * Run: node src/scripts/seed-metadata.js
 */

const BASE = 'http://localhost:3000';

async function api(method, path, body, token, tenantHeader = 'default_tenant') {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-tenant-id': tenantHeader,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json().catch(() => null);
}

async function deleteAll(path, token) {
  const raw = await api('GET', `${path}?limit=200`, null, token);
  const items = Array.isArray(raw) ? raw : raw?.data ?? [];
  let count = 0;
  for (const item of items) {
    try { await api('DELETE', `${path}/${item._id}`, null, token); count++; } catch (_) {}
  }
  return count;
}

async function main() {
  // 1. Login
  console.log('🔑 Logging in…');
  const auth = await api('POST', '/auth/login', { username: 'admin@company.com', password: 'Admin123!' });
  const token = auth.access_token;
  if (!token) throw new Error('Login failed');
  console.log('✅ Logged in\n');

  // ──────────────────────────────────────────────────
  // ROOMS
  // ──────────────────────────────────────────────────
  console.log('🛏  Seeding Rooms…');
  const existingRooms = await deleteAll('/rooms', token);
  console.log(`   Removed ${existingRooms} existing rooms`);

  const rooms = [
    // ICU
    { room_number: 'ICU-01', floor: 1, type: 'icu', bed_capacity: 4, daily_rate: 8500, department: 'ICU', amenities: ['Ventilator', 'Cardiac Monitor', 'IV Stand', 'Call Bell'] },
    { room_number: 'ICU-02', floor: 1, type: 'icu', bed_capacity: 4, daily_rate: 8500, department: 'ICU', amenities: ['Ventilator', 'Cardiac Monitor', 'IV Stand', 'Call Bell'] },
    { room_number: 'ICU-03', floor: 1, type: 'icu', bed_capacity: 2, daily_rate: 9000, department: 'Cardiology ICU', amenities: ['Ventilator', 'ECG Monitor', 'Defibrillator', 'IV Stand'] },

    // General Wards
    { room_number: 'GW-101', floor: 1, type: 'general', bed_capacity: 8, daily_rate: 1200, department: 'General Medicine', amenities: ['Fan', 'Shared Bathroom', 'Call Bell'] },
    { room_number: 'GW-102', floor: 1, type: 'general', bed_capacity: 8, daily_rate: 1200, department: 'General Medicine', amenities: ['Fan', 'Shared Bathroom', 'Call Bell'] },
    { room_number: 'GW-201', floor: 2, type: 'general', bed_capacity: 6, daily_rate: 1200, department: 'Orthopaedics', amenities: ['Fan', 'Shared Bathroom', 'Call Bell', 'Physiotherapy Access'] },
    { room_number: 'GW-202', floor: 2, type: 'general', bed_capacity: 6, daily_rate: 1200, department: 'Gynaecology', amenities: ['Fan', 'Shared Bathroom', 'Call Bell'] },
    { room_number: 'GW-301', floor: 3, type: 'general', bed_capacity: 8, daily_rate: 1200, department: 'Paediatrics', amenities: ['Fan', 'Shared Bathroom', 'Call Bell', 'Play Area Access'] },

    // Semi-Private
    { room_number: 'SP-104', floor: 1, type: 'semi_private', bed_capacity: 2, daily_rate: 2800, department: 'General Medicine', amenities: ['AC', 'Semi-Private Bathroom', 'TV', 'Call Bell'] },
    { room_number: 'SP-204', floor: 2, type: 'semi_private', bed_capacity: 2, daily_rate: 2800, department: 'Orthopaedics', amenities: ['AC', 'Semi-Private Bathroom', 'TV', 'Call Bell'] },
    { room_number: 'SP-304', floor: 3, type: 'semi_private', bed_capacity: 2, daily_rate: 2800, department: 'Paediatrics', amenities: ['AC', 'Semi-Private Bathroom', 'TV', 'Call Bell', 'Cot for Parent'] },
    { room_number: 'SP-404', floor: 4, type: 'semi_private', bed_capacity: 2, daily_rate: 3000, department: 'Cardiology', amenities: ['AC', 'Semi-Private Bathroom', 'TV', 'Call Bell', 'ECG Monitor'] },

    // Private Rooms
    { room_number: 'PR-105', floor: 1, type: 'private', bed_capacity: 1, daily_rate: 4500, department: 'General Medicine', amenities: ['AC', 'Attached Bathroom', 'TV', 'Sofa', 'Refrigerator', 'Call Bell'] },
    { room_number: 'PR-205', floor: 2, type: 'private', bed_capacity: 1, daily_rate: 4500, department: 'Orthopaedics', amenities: ['AC', 'Attached Bathroom', 'TV', 'Sofa', 'Refrigerator', 'Call Bell'] },
    { room_number: 'PR-305', floor: 3, type: 'private', bed_capacity: 1, daily_rate: 4500, department: 'Cardiology', amenities: ['AC', 'Attached Bathroom', 'TV', 'Sofa', 'Refrigerator', 'ECG Monitor'] },
    { room_number: 'PR-405', floor: 4, type: 'private', bed_capacity: 1, daily_rate: 4800, department: 'Neurology', amenities: ['AC', 'Attached Bathroom', 'TV', 'Sofa', 'Refrigerator', 'Call Bell'] },
    { room_number: 'PR-505', floor: 5, type: 'private', bed_capacity: 1, daily_rate: 4800, department: 'Oncology', amenities: ['AC', 'Attached Bathroom', 'TV', 'Sofa', 'Refrigerator', 'Call Bell'] },

    // Deluxe Rooms
    { room_number: 'DX-106', floor: 1, type: 'deluxe', bed_capacity: 1, daily_rate: 7500, department: 'General Medicine', amenities: ['AC', 'Jacuzzi', 'LCD TV', 'Lounge Area', 'Mini Bar', 'Call Bell', 'Wi-Fi'] },
    { room_number: 'DX-406', floor: 4, type: 'deluxe', bed_capacity: 1, daily_rate: 7500, department: 'Cardiology', amenities: ['AC', 'Jacuzzi', 'LCD TV', 'Lounge Area', 'ECG Monitor', 'Wi-Fi'] },

    // Suite
    { room_number: 'SU-501', floor: 5, type: 'suite', bed_capacity: 1, daily_rate: 12000, department: 'VIP', amenities: ['AC', 'Jacuzzi', '65" LCD TV', 'Living Room', 'Dining Area', 'Kitchen', 'Concierge', 'Wi-Fi'] },
  ];

  let roomsCreated = 0;
  for (const room of rooms) {
    try {
      await api('POST', '/rooms', room, token);
      roomsCreated++;
    } catch (e) {
      console.warn(`   ⚠️  Room ${room.room_number}: ${e.message.slice(0, 60)}`);
    }
  }
  console.log(`   ✅ Created ${roomsCreated} rooms\n`);

  // ──────────────────────────────────────────────────
  // DIAGNOSTIC TESTS
  // ──────────────────────────────────────────────────
  console.log('🧪 Seeding Diagnostic Tests…');
  const existingTests = await deleteAll('/diagnostics/tests', token);
  console.log(`   Removed ${existingTests} existing tests`);

  const diagTests = [
    // Haematology
    { test_code: 'CBC-001', name: 'Complete Blood Count (CBC)', category: 'Haematology', price: 350, duration_minutes: 60, department: 'Pathology', preparation_instructions: 'No special preparation required', description: 'Measures RBC, WBC, platelet counts and haemoglobin' },
    { test_code: 'CBC-002', name: 'Peripheral Blood Smear', category: 'Haematology', price: 250, duration_minutes: 90, department: 'Pathology', preparation_instructions: 'No special preparation required', description: 'Microscopic examination of blood cells' },
    { test_code: 'CBC-003', name: 'Prothrombin Time (PT/INR)', category: 'Haematology', price: 400, duration_minutes: 120, department: 'Pathology', preparation_instructions: 'No special preparation required', description: 'Measures blood clotting time' },
    { test_code: 'CBC-004', name: 'ESR (Erythrocyte Sedimentation Rate)', category: 'Haematology', price: 180, duration_minutes: 60, department: 'Pathology', preparation_instructions: 'No special preparation required', description: 'Inflammation marker test' },

    // Biochemistry
    { test_code: 'BIO-001', name: 'Lipid Profile', category: 'Biochemistry', price: 700, duration_minutes: 240, department: 'Biochemistry', preparation_instructions: '12 hours fasting required', description: 'Total cholesterol, HDL, LDL, triglycerides' },
    { test_code: 'BIO-002', name: 'Liver Function Test (LFT)', category: 'Biochemistry', price: 850, duration_minutes: 180, department: 'Biochemistry', preparation_instructions: '8 hours fasting required', description: 'ALT, AST, bilirubin, albumin, alkaline phosphatase' },
    { test_code: 'BIO-003', name: 'Kidney Function Test (KFT)', category: 'Biochemistry', price: 750, duration_minutes: 180, department: 'Biochemistry', preparation_instructions: 'No special preparation required', description: 'Creatinine, urea, uric acid, electrolytes' },
    { test_code: 'BIO-004', name: 'Blood Glucose Fasting', category: 'Biochemistry', price: 120, duration_minutes: 60, department: 'Biochemistry', preparation_instructions: '8 hours fasting required', description: 'Fasting blood sugar level' },
    { test_code: 'BIO-005', name: 'HbA1c (Glycated Haemoglobin)', category: 'Biochemistry', price: 550, duration_minutes: 120, department: 'Biochemistry', preparation_instructions: 'No special preparation required', description: '3-month average blood glucose indicator' },
    { test_code: 'BIO-006', name: 'Thyroid Profile (T3/T4/TSH)', category: 'Biochemistry', price: 900, duration_minutes: 240, department: 'Biochemistry', preparation_instructions: 'Morning sample preferred, no special prep', description: 'Complete thyroid function evaluation' },

    // Microbiology
    { test_code: 'MIC-001', name: 'Blood Culture & Sensitivity', category: 'Microbiology', price: 1200, duration_minutes: 2880, department: 'Microbiology', preparation_instructions: 'Sample taken during fever spike', description: 'Detects bacterial/fungal infections in blood' },
    { test_code: 'MIC-002', name: 'Urine Culture & Sensitivity', category: 'Microbiology', price: 800, duration_minutes: 1440, department: 'Microbiology', preparation_instructions: 'Mid-stream clean catch urine sample', description: 'Detects urinary tract infections' },
    { test_code: 'MIC-003', name: 'Sputum Culture & Sensitivity', category: 'Microbiology', price: 750, duration_minutes: 1440, department: 'Microbiology', preparation_instructions: 'Morning sample before eating', description: 'Detects respiratory tract infections' },

    // Radiology / Imaging
    { test_code: 'RAD-001', name: 'Chest X-Ray (PA View)', category: 'Radiology', price: 500, duration_minutes: 30, department: 'Radiology', preparation_instructions: 'No metal jewellery', description: 'Standard chest radiograph' },
    { test_code: 'RAD-002', name: 'ECG (12-Lead)', category: 'Cardiology', price: 350, duration_minutes: 15, department: 'Cardiology', preparation_instructions: 'No special preparation required', description: '12-lead electrocardiogram' },
    { test_code: 'RAD-003', name: '2D Echocardiography', category: 'Cardiology', price: 2500, duration_minutes: 45, department: 'Cardiology', preparation_instructions: 'No special preparation required', description: 'Ultrasound imaging of heart structure and function' },
    { test_code: 'RAD-004', name: 'Ultrasound Abdomen', category: 'Radiology', price: 1200, duration_minutes: 30, department: 'Radiology', preparation_instructions: '4 hours fasting, full bladder required', description: 'Sonographic examination of abdominal organs' },
    { test_code: 'RAD-005', name: 'CT Scan — Chest', category: 'Radiology', price: 5500, duration_minutes: 60, department: 'Radiology', preparation_instructions: 'Remove metal objects, contrast may be used', description: 'High-resolution chest CT imaging' },
    { test_code: 'RAD-006', name: 'MRI Brain', category: 'Radiology', price: 8500, duration_minutes: 90, department: 'Neurology', preparation_instructions: 'No metal implants, remove all jewellery', description: 'Detailed brain MRI for neurological assessment' },

    // Pathology
    { test_code: 'PAT-001', name: 'Urine Routine & Microscopy', category: 'Pathology', price: 200, duration_minutes: 60, department: 'Pathology', preparation_instructions: 'Mid-stream urine sample', description: 'Physical, chemical and microscopic urine analysis' },
    { test_code: 'PAT-002', name: 'Stool Routine Examination', category: 'Pathology', price: 180, duration_minutes: 60, department: 'Pathology', preparation_instructions: 'Fresh sample in clean container', description: 'Routine stool analysis for parasites and bacteria' },
  ];

  let testsCreated = 0;
  for (const test of diagTests) {
    try {
      await api('POST', '/diagnostics/tests', test, token);
      testsCreated++;
    } catch (e) {
      console.warn(`   ⚠️  Test ${test.test_code}: ${e.message.slice(0, 60)}`);
    }
  }
  console.log(`   ✅ Created ${testsCreated} diagnostic tests\n`);

  // ──────────────────────────────────────────────────
  // MEDICATIONS
  // ──────────────────────────────────────────────────
  console.log('💊 Seeding Medications…');
  const existingMeds = await deleteAll('/medications/catalog', token);
  console.log(`   Removed ${existingMeds} existing medications`);

  const medications = [
    // Antibiotics
    { drug_code: 'AMX-001', name: 'Amoxicillin 500mg', generic_name: 'Amoxicillin', dosage_form: 'capsule', strength: '500mg', price_per_unit: 12, stock_quantity: 5000, manufacturer: 'Cipla Ltd', category: 'Antibiotics' },
    { drug_code: 'AZI-001', name: 'Azithromycin 500mg', generic_name: 'Azithromycin', dosage_form: 'tablet', strength: '500mg', price_per_unit: 35, stock_quantity: 3000, manufacturer: 'Sun Pharma', category: 'Antibiotics' },
    { drug_code: 'CIP-001', name: 'Ciprofloxacin 500mg', generic_name: 'Ciprofloxacin', dosage_form: 'tablet', strength: '500mg', price_per_unit: 18, stock_quantity: 4000, manufacturer: 'Dr. Reddy\'s', category: 'Antibiotics' },
    { drug_code: 'MET-001', name: 'Metronidazole 400mg', generic_name: 'Metronidazole', dosage_form: 'tablet', strength: '400mg', price_per_unit: 8, stock_quantity: 4000, manufacturer: 'Cipla Ltd', category: 'Antibiotics' },
    { drug_code: 'CEF-001', name: 'Cefuroxime 500mg', generic_name: 'Cefuroxime', dosage_form: 'tablet', strength: '500mg', price_per_unit: 55, stock_quantity: 2000, manufacturer: 'GlaxoSmithKline', category: 'Antibiotics' },

    // Analgesics / NSAIDs
    { drug_code: 'PCT-001', name: 'Paracetamol 500mg', generic_name: 'Paracetamol (Acetaminophen)', dosage_form: 'tablet', strength: '500mg', price_per_unit: 4, stock_quantity: 10000, manufacturer: 'Cipla Ltd', category: 'Analgesics' },
    { drug_code: 'IBU-001', name: 'Ibuprofen 400mg', generic_name: 'Ibuprofen', dosage_form: 'tablet', strength: '400mg', price_per_unit: 7, stock_quantity: 6000, manufacturer: 'Abbott India', category: 'Analgesics' },
    { drug_code: 'DIC-001', name: 'Diclofenac 50mg', generic_name: 'Diclofenac Sodium', dosage_form: 'tablet', strength: '50mg', price_per_unit: 6, stock_quantity: 5000, manufacturer: 'Novartis India', category: 'Analgesics' },
    { drug_code: 'TRM-001', name: 'Tramadol 50mg', generic_name: 'Tramadol HCl', dosage_form: 'capsule', strength: '50mg', price_per_unit: 22, stock_quantity: 2000, manufacturer: 'Sun Pharma', category: 'Analgesics' },

    // Cardiovascular
    { drug_code: 'AML-001', name: 'Amlodipine 5mg', generic_name: 'Amlodipine Besylate', dosage_form: 'tablet', strength: '5mg', price_per_unit: 9, stock_quantity: 5000, manufacturer: 'Cipla Ltd', category: 'Cardiovascular' },
    { drug_code: 'ATR-001', name: 'Atorvastatin 20mg', generic_name: 'Atorvastatin Calcium', dosage_form: 'tablet', strength: '20mg', price_per_unit: 18, stock_quantity: 4000, manufacturer: 'Pfizer India', category: 'Cardiovascular' },
    { drug_code: 'MTP-001', name: 'Metoprolol 50mg', generic_name: 'Metoprolol Succinate', dosage_form: 'tablet', strength: '50mg', price_per_unit: 14, stock_quantity: 3000, manufacturer: 'AstraZeneca India', category: 'Cardiovascular' },
    { drug_code: 'ENP-001', name: 'Enalapril 5mg', generic_name: 'Enalapril Maleate', dosage_form: 'tablet', strength: '5mg', price_per_unit: 11, stock_quantity: 3500, manufacturer: 'Merck India', category: 'Cardiovascular' },
    { drug_code: 'WAR-001', name: 'Warfarin 5mg', generic_name: 'Warfarin Sodium', dosage_form: 'tablet', strength: '5mg', price_per_unit: 25, stock_quantity: 1500, manufacturer: 'Bristol-Myers Squibb', category: 'Cardiovascular' },

    // Antidiabetics
    { drug_code: 'MFM-001', name: 'Metformin 500mg', generic_name: 'Metformin HCl', dosage_form: 'tablet', strength: '500mg', price_per_unit: 5, stock_quantity: 8000, manufacturer: 'USV Ltd', category: 'Antidiabetics' },
    { drug_code: 'GLM-001', name: 'Glimepiride 2mg', generic_name: 'Glimepiride', dosage_form: 'tablet', strength: '2mg', price_per_unit: 15, stock_quantity: 3000, manufacturer: 'Sanofi India', category: 'Antidiabetics' },
    { drug_code: 'INS-001', name: 'Insulin Glargine 100IU/ml', generic_name: 'Insulin Glargine', dosage_form: 'injection', strength: '100IU/ml', price_per_unit: 850, stock_quantity: 500, manufacturer: 'Sanofi India', category: 'Antidiabetics' },

    // Respiratory
    { drug_code: 'SAL-001', name: 'Salbutamol Inhaler 100mcg', generic_name: 'Salbutamol (Albuterol)', dosage_form: 'inhaler', strength: '100mcg/dose', price_per_unit: 180, stock_quantity: 800, manufacturer: 'GlaxoSmithKline', category: 'Respiratory' },
    { drug_code: 'MNT-001', name: 'Montelukast 10mg', generic_name: 'Montelukast Sodium', dosage_form: 'tablet', strength: '10mg', price_per_unit: 28, stock_quantity: 2500, manufacturer: 'MSD India', category: 'Respiratory' },

    // GI / Antacids
    { drug_code: 'OMP-001', name: 'Omeprazole 20mg', generic_name: 'Omeprazole', dosage_form: 'capsule', strength: '20mg', price_per_unit: 10, stock_quantity: 6000, manufacturer: 'AstraZeneca India', category: 'GI / Antacids' },
    { drug_code: 'PAN-001', name: 'Pantoprazole 40mg', generic_name: 'Pantoprazole Sodium', dosage_form: 'tablet', strength: '40mg', price_per_unit: 12, stock_quantity: 5000, manufacturer: 'Takeda India', category: 'GI / Antacids' },
    { drug_code: 'DOM-001', name: 'Domperidone 10mg', generic_name: 'Domperidone', dosage_form: 'tablet', strength: '10mg', price_per_unit: 6, stock_quantity: 4000, manufacturer: 'Janssen India', category: 'GI / Antacids' },

    // IV Fluids / Injectables
    { drug_code: 'NS-001', name: 'Normal Saline 0.9% 500ml', generic_name: 'Sodium Chloride 0.9%', dosage_form: 'injection', strength: '0.9% 500ml', price_per_unit: 65, stock_quantity: 2000, manufacturer: 'Baxter India', category: 'IV Fluids' },
    { drug_code: 'RL-001', name: "Ringer's Lactate 500ml", generic_name: "Ringer's Lactate Solution", dosage_form: 'injection', strength: '500ml', price_per_unit: 75, stock_quantity: 1500, manufacturer: 'Baxter India', category: 'IV Fluids' },
    { drug_code: 'DNS-001', name: 'DNS 5% 500ml', generic_name: 'Dextrose Normal Saline 5%', dosage_form: 'injection', strength: '5% 500ml', price_per_unit: 80, stock_quantity: 1200, manufacturer: 'Fresenius Kabi', category: 'IV Fluids' },
  ];

  let medsCreated = 0;
  for (const med of medications) {
    try {
      await api('POST', '/medications/catalog', med, token);
      medsCreated++;
    } catch (e) {
      console.warn(`   ⚠️  Med ${med.drug_code}: ${e.message.slice(0, 80)}`);
    }
  }
  console.log(`   ✅ Created ${medsCreated} medications\n`);

  console.log('✅ Metadata seed complete!\n');
  console.log(`   Rooms: ${roomsCreated}   Diagnostic Tests: ${testsCreated}   Medications: ${medsCreated}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
