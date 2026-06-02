#!/bin/bash
# ─── Full data seeder ─────────────────────────────────────────────────────────
# Creates realistic data across ALL modules via REST API.
# Uses the same field contracts the frontend sends.
# Usage: ./scripts/seed-full-data.sh
# ──────────────────────────────────────────────────────────────────────────────

set -e
API="http://localhost:3000"

echo "🔑 Logging in..."
TOKEN=$(curl -sf "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).access_token))")

if [ -z "$TOKEN" ]; then echo "❌ Login failed"; exit 1; fi
echo "✅ Authenticated"

AUTH="Authorization: Bearer $TOKEN"
CT="Content-Type: application/json"

post() {
  local endpoint="$1"
  local data="$2"
  local label="$3"
  local result=$(curl -sf -w "\n%{http_code}" "$API/$endpoint" -H "$AUTH" -H "$CT" -d "$data" 2>&1)
  local code=$(echo "$result" | tail -1)
  local body=$(echo "$result" | sed '$d')
  if [[ "$code" =~ ^2 ]]; then
    echo "  ✅ $label"
    echo "$body"
  else
    echo "  ⚠️  $label (HTTP $code)"
    echo "$body" | head -1
    echo ""
  fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# 1. TAXES (global, no tenantId needed)
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "═══ Creating Taxes ═══"

post "taxes" '{
  "tax_code": "GST18",
  "name": "GST 18%",
  "description": "Standard GST rate for most goods and services",
  "rate": 18,
  "rate_type": "percentage",
  "applicable_on": "both",
  "status": "active",
  "jurisdiction": "India",
  "tax_category": "GST"
}' "GST 18%"

post "taxes" '{
  "tax_code": "GST12",
  "name": "GST 12%",
  "description": "Reduced GST rate for essential items",
  "rate": 12,
  "rate_type": "percentage",
  "applicable_on": "both",
  "status": "active",
  "jurisdiction": "India",
  "tax_category": "GST"
}' "GST 12%"

post "taxes" '{
  "tax_code": "GST5",
  "name": "GST 5%",
  "description": "Lower GST rate for essential medicines and food items",
  "rate": 5,
  "rate_type": "percentage",
  "applicable_on": "both",
  "status": "active",
  "jurisdiction": "India",
  "tax_category": "GST"
}' "GST 5%"

post "taxes" '{
  "tax_code": "GST28",
  "name": "GST 28%",
  "description": "Luxury GST rate for premium goods",
  "rate": 28,
  "rate_type": "percentage",
  "applicable_on": "sales",
  "status": "active",
  "jurisdiction": "India",
  "tax_category": "GST"
}' "GST 28%"

post "taxes" '{
  "tax_code": "EXEMPT",
  "name": "Tax Exempt",
  "description": "No tax applicable - exempt category",
  "rate": 0,
  "rate_type": "percentage",
  "applicable_on": "both",
  "status": "active",
  "jurisdiction": "India",
  "tax_category": "Exempt"
}' "Tax Exempt"


# ═══════════════════════════════════════════════════════════════════════════════
# 2. VENDORS
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "═══ Creating Vendors ═══"

post "vendors" '{
  "vendor_code": "V001",
  "name": "MedPharma Distributors",
  "tax_id": "29AABCU9603R1ZM",
  "legal_name": "MedPharma Distributors Pvt Ltd",
  "address": "Plot 42, Pharmaceutical Zone, Hyderabad 500032",
  "contact_persons": ["Rajesh Mehta", "Priya Sharma"],
  "default_lead_time_days": 7,
  "payment_terms": "Net-30",
  "supported_tax_slabs": ["GST18", "GST12"],
  "custom_fields": {
    "category": "Pharmaceutical",
    "status": "Active",
    "email": "orders@medpharma.in",
    "phone": "9876543210",
    "city": "Hyderabad",
    "state": "Telangana",
    "gst_number": "29AABCU9603R1ZM",
    "payment_methods": ["Bank Transfer", "NEFT"],
    "risk_level": "Low",
    "creditLimit": 1500000,
    "totalOrders": 142,
    "totalValue": 8750000,
    "outstandingBalance": 245000,
    "registrationDate": "2023-01-15",
    "website": "https://medpharma.in",
    "country": "India",
    "zipCode": "500032"
  }
}' "MedPharma Distributors"

post "vendors" '{
  "vendor_code": "V002",
  "name": "SurgiTech Equipment",
  "tax_id": "27AADCS2207R1Z5",
  "legal_name": "SurgiTech Equipment India Pvt Ltd",
  "address": "B-12 Industrial Estate, Pune 411018",
  "contact_persons": ["Dr. Amitabh Roy"],
  "default_lead_time_days": 14,
  "payment_terms": "Net-60",
  "custom_fields": {
    "category": "Medical Devices",
    "status": "Active",
    "email": "sales@surgitech.in",
    "phone": "9123456789",
    "city": "Pune",
    "state": "Maharashtra",
    "gst_number": "27AADCS2207R1Z5",
    "payment_methods": ["Bank Transfer", "Cheque"],
    "risk_level": "Low",
    "creditLimit": 3000000,
    "totalOrders": 67,
    "totalValue": 15200000,
    "outstandingBalance": 890000,
    "registrationDate": "2022-06-20",
    "website": "https://surgitech.co.in",
    "country": "India",
    "zipCode": "411018"
  }
}' "SurgiTech Equipment"

post "vendors" '{
  "vendor_code": "V003",
  "name": "LabChem Supplies",
  "tax_id": "33AABCL4567R1ZP",
  "legal_name": "LabChem Supplies Pvt Ltd",
  "address": "75 Anna Salai, Chennai 600002",
  "contact_persons": ["Sunita Rajan"],
  "default_lead_time_days": 5,
  "payment_terms": "Net-30",
  "custom_fields": {
    "category": "Laboratory",
    "status": "Active",
    "email": "info@labchem.in",
    "phone": "9445678901",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "gst_number": "33AABCL4567R1ZP",
    "payment_methods": ["UPI", "Bank Transfer"],
    "risk_level": "Medium",
    "creditLimit": 500000,
    "totalOrders": 89,
    "totalValue": 3200000,
    "outstandingBalance": 120000,
    "registrationDate": "2023-08-10",
    "country": "India",
    "zipCode": "600002"
  }
}' "LabChem Supplies"

post "vendors" '{
  "vendor_code": "V004",
  "name": "NovaCare Biologics",
  "tax_id": "06AADCN8901R1ZQ",
  "legal_name": "NovaCare Biologics Ltd",
  "address": "Sector 15, Gurgaon 122001",
  "contact_persons": ["Vikram Singh", "Neha Gupta"],
  "default_lead_time_days": 10,
  "payment_terms": "Net-45",
  "custom_fields": {
    "category": "Pharmaceutical",
    "status": "Active",
    "email": "procurement@novacare.in",
    "phone": "9988776655",
    "city": "Gurgaon",
    "state": "Haryana",
    "gst_number": "06AADCN8901R1ZQ",
    "payment_methods": ["Bank Transfer", "Net-30"],
    "risk_level": "Low",
    "creditLimit": 2000000,
    "totalOrders": 38,
    "totalValue": 4500000,
    "outstandingBalance": 0,
    "registrationDate": "2024-02-01",
    "website": "https://novacare.in",
    "country": "India",
    "zipCode": "122001"
  }
}' "NovaCare Biologics"

post "vendors" '{
  "vendor_code": "V005",
  "name": "BioMed Instruments",
  "tax_id": "19AABCB3456R1ZK",
  "legal_name": "BioMed Instruments (India) Pvt Ltd",
  "address": "Salt Lake City, Kolkata 700091",
  "contact_persons": ["Arjun Chatterjee"],
  "default_lead_time_days": 21,
  "payment_terms": "Net-60",
  "custom_fields": {
    "category": "Medical Devices",
    "status": "Inactive",
    "email": "contact@biomed.in",
    "phone": "9876001234",
    "city": "Kolkata",
    "state": "West Bengal",
    "gst_number": "19AABCB3456R1ZK",
    "payment_methods": ["Cheque"],
    "risk_level": "High",
    "creditLimit": 750000,
    "totalOrders": 12,
    "totalValue": 980000,
    "outstandingBalance": 450000,
    "registrationDate": "2024-11-05",
    "country": "India",
    "zipCode": "700091"
  }
}' "BioMed Instruments"


# ═══════════════════════════════════════════════════════════════════════════════
# 3. DIAGNOSTIC TESTS (Catalog)
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "═══ Creating Diagnostic Test Catalog ═══"

for test_data in \
  '{"test_code":"CBC001","name":"Complete Blood Count (CBC)","category":"Hematology","price":450,"duration_minutes":30,"preparation_instructions":"Fasting not required","department":"Pathology","description":"Measures red/white blood cells, hemoglobin, hematocrit, platelets","is_active":true}' \
  '{"test_code":"LFT001","name":"Liver Function Test (LFT)","category":"Biochemistry","price":850,"duration_minutes":45,"preparation_instructions":"12 hours fasting required","department":"Biochemistry","description":"SGOT, SGPT, ALP, bilirubin, albumin, total protein","is_active":true}' \
  '{"test_code":"KFT001","name":"Kidney Function Test (KFT)","category":"Biochemistry","price":750,"duration_minutes":45,"preparation_instructions":"8 hours fasting recommended","department":"Biochemistry","description":"BUN, creatinine, uric acid, electrolytes","is_active":true}' \
  '{"test_code":"TSH001","name":"Thyroid Profile (TSH, T3, T4)","category":"Endocrinology","price":950,"duration_minutes":60,"preparation_instructions":"No special preparation","department":"Pathology","description":"TSH, Free T3, Free T4 levels","is_active":true}' \
  '{"test_code":"XRAY001","name":"Chest X-Ray (PA View)","category":"Radiology","price":350,"duration_minutes":15,"preparation_instructions":"Remove metallic objects","department":"Radiology","description":"Posteroanterior chest radiograph","is_active":true}' \
  '{"test_code":"ECG001","name":"Electrocardiogram (ECG)","category":"Cardiology","price":300,"duration_minutes":20,"preparation_instructions":"No caffeine 2 hours before","department":"Cardiology","description":"12-lead resting ECG","is_active":true}' \
  '{"test_code":"ECHO001","name":"2D Echocardiography","category":"Cardiology","price":2500,"duration_minutes":45,"preparation_instructions":"No special preparation","department":"Cardiology","description":"Ultrasound imaging of heart chambers and valves","is_active":true}' \
  '{"test_code":"URINE001","name":"Urine Routine & Microscopy","category":"Pathology","price":200,"duration_minutes":30,"preparation_instructions":"Midstream clean-catch sample","department":"Pathology","description":"Physical, chemical and microscopic urine analysis","is_active":true}' \
  '{"test_code":"HBA1C001","name":"HbA1c (Glycated Hemoglobin)","category":"Biochemistry","price":550,"duration_minutes":30,"preparation_instructions":"No fasting required","department":"Pathology","description":"Average blood sugar over 2-3 months","is_active":true}' \
  '{"test_code":"MRI001","name":"MRI Brain (Plain)","category":"Radiology","price":6500,"duration_minutes":45,"preparation_instructions":"Remove all metallic implants/jewelry","department":"Radiology","description":"Magnetic resonance imaging of brain without contrast","is_active":true}' \
  '{"test_code":"CT001","name":"CT Scan Abdomen","category":"Radiology","price":4500,"duration_minutes":30,"preparation_instructions":"4 hours fasting, oral contrast","department":"Radiology","description":"Computed tomography of abdomen with contrast","is_active":true}' \
  '{"test_code":"LIPID001","name":"Lipid Profile","category":"Biochemistry","price":600,"duration_minutes":30,"preparation_instructions":"12 hours fasting required","department":"Biochemistry","description":"Total cholesterol, HDL, LDL, triglycerides, VLDL","is_active":true}'
do
  name=$(echo "$test_data" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).name))")
  post "diagnostics/tests" "$test_data" "$name"
done


# ═══════════════════════════════════════════════════════════════════════════════
# 4. MORE PATIENTS (we already have 4, add more variety)
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "═══ Creating Additional Patients ═══"

post "patients" '{
  "patient_id": "PAT-1005",
  "first_name": "Ananya",
  "last_name": "Patel",
  "gender": "F",
  "dob": "1992-03-22",
  "phone": "9876501111",
  "email": "ananya.patel@email.com",
  "address": "45 MG Road, Bengaluru 560001",
  "blood_group": "B+",
  "emergency_contact_name": "Rohit Patel",
  "emergency_contact_phone": "9876502222",
  "allergies": ["Penicillin"],
  "existing_conditions": ["Asthma"],
  "status": "active",
  "department": "Pulmonology",
  "custom_fields": {}
}' "Ananya Patel"

post "patients" '{
  "patient_id": "PAT-1006",
  "first_name": "Mohammed",
  "last_name": "Ali",
  "gender": "M",
  "dob": "1975-11-08",
  "phone": "9876503333",
  "email": "mohammed.ali@email.com",
  "address": "12 Jubilee Hills, Hyderabad 500033",
  "blood_group": "A-",
  "emergency_contact_name": "Fatima Ali",
  "emergency_contact_phone": "9876504444",
  "allergies": [],
  "existing_conditions": ["Type 2 Diabetes", "Hypertension"],
  "status": "active",
  "department": "Endocrinology",
  "custom_fields": {}
}' "Mohammed Ali"

post "patients" '{
  "patient_id": "PAT-1007",
  "first_name": "Priya",
  "last_name": "Sharma",
  "gender": "F",
  "dob": "1988-07-14",
  "phone": "9876505555",
  "email": "priya.sharma@email.com",
  "address": "78 Connaught Place, New Delhi 110001",
  "blood_group": "O+",
  "emergency_contact_name": "Amit Sharma",
  "emergency_contact_phone": "9876506666",
  "allergies": ["Sulfa drugs"],
  "existing_conditions": [],
  "status": "active",
  "department": "General Medicine",
  "custom_fields": {}
}' "Priya Sharma"

post "patients" '{
  "patient_id": "PAT-1008",
  "first_name": "Suresh",
  "last_name": "Reddy",
  "gender": "M",
  "dob": "1965-01-30",
  "phone": "9876507777",
  "email": "suresh.reddy@email.com",
  "address": "23 Banjara Hills, Hyderabad 500034",
  "blood_group": "AB+",
  "emergency_contact_name": "Lakshmi Reddy",
  "emergency_contact_phone": "9876508888",
  "allergies": ["Aspirin"],
  "existing_conditions": ["Coronary Artery Disease", "Hyperlipidemia"],
  "status": "active",
  "department": "Cardiology",
  "custom_fields": {}
}' "Suresh Reddy"

post "patients" '{
  "patient_id": "PAT-1009",
  "first_name": "Deepa",
  "last_name": "Menon",
  "gender": "F",
  "dob": "2001-09-05",
  "phone": "9876509999",
  "email": "deepa.menon@email.com",
  "address": "56 Marine Drive, Kochi 682001",
  "blood_group": "B-",
  "emergency_contact_name": "Vijay Menon",
  "emergency_contact_phone": "9876510000",
  "allergies": [],
  "existing_conditions": [],
  "status": "active",
  "department": "Orthopedics",
  "custom_fields": {}
}' "Deepa Menon"

post "patients" '{
  "patient_id": "PAT-1010",
  "first_name": "Arun",
  "last_name": "Nair",
  "gender": "M",
  "dob": "1958-04-18",
  "phone": "9876511111",
  "email": "arun.nair@email.com",
  "address": "34 Park Street, Kolkata 700016",
  "blood_group": "O-",
  "emergency_contact_name": "Sita Nair",
  "emergency_contact_phone": "9876512222",
  "allergies": ["Ibuprofen", "Codeine"],
  "existing_conditions": ["COPD", "Osteoarthritis"],
  "status": "active",
  "department": "Pulmonology",
  "custom_fields": {}
}' "Arun Nair"


# ═══════════════════════════════════════════════════════════════════════════════
# 5. MORE ROOMS (we have 10, but they may lack proper schema fields)
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "═══ Creating Additional Rooms ═══"

post "rooms" '{
  "room_number": "ICU-01",
  "floor": "Ground",
  "type": "icu",
  "status": "available",
  "bed_capacity": 1,
  "daily_rate": 8500,
  "amenities": ["Ventilator", "Cardiac Monitor", "Central Oxygen"],
  "department": "Critical Care",
  "custom_fields": {}
}' "ICU-01"

post "rooms" '{
  "room_number": "ICU-02",
  "floor": "Ground",
  "type": "icu",
  "status": "occupied",
  "bed_capacity": 1,
  "occupied_beds": 1,
  "daily_rate": 8500,
  "amenities": ["Ventilator", "Cardiac Monitor", "Central Oxygen"],
  "department": "Critical Care",
  "custom_fields": {}
}' "ICU-02"

post "rooms" '{
  "room_number": "DLX-201",
  "floor": "2",
  "type": "deluxe",
  "status": "available",
  "bed_capacity": 1,
  "daily_rate": 4500,
  "amenities": ["AC", "TV", "Attached Bathroom", "Wi-Fi", "Sofa"],
  "department": "General",
  "custom_fields": {}
}' "DLX-201"

post "rooms" '{
  "room_number": "PVT-301",
  "floor": "3",
  "type": "private",
  "status": "available",
  "bed_capacity": 1,
  "daily_rate": 3000,
  "amenities": ["AC", "TV", "Attached Bathroom"],
  "department": "General",
  "custom_fields": {}
}' "PVT-301"

post "rooms" '{
  "room_number": "STE-401",
  "floor": "4",
  "type": "suite",
  "status": "available",
  "bed_capacity": 1,
  "daily_rate": 12000,
  "amenities": ["AC", "TV", "Attached Bathroom", "Wi-Fi", "Sofa", "Mini-Fridge", "Microwave", "Living Area"],
  "department": "VIP",
  "custom_fields": {}
}' "STE-401"


# ═══════════════════════════════════════════════════════════════════════════════
# 6. PURCHASE ORDERS
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "═══ Creating Purchase Orders ═══"

post "purchase-orders" '{
  "po_number": "PO-2026-0001",
  "vendor_name": "MedPharma Distributors",
  "vendor_phone": "9876543210",
  "vendor_email": "orders@medpharma.in",
  "vendor_address": "Plot 42, Pharmaceutical Zone, Hyderabad",
  "shipping_address": "MedSystem Hospital, Main Campus, Receiving Dock",
  "order_date": "2026-05-20",
  "delivery_date": "2026-05-27",
  "items": [
    {"name": "Amoxicillin 500mg", "qty": 500, "unit_price": 8, "discount": 5, "subtotal": 3800, "tax_slab": 12, "sale_unit": "Strip"},
    {"name": "Paracetamol 650mg", "qty": 1000, "unit_price": 3, "discount": 0, "subtotal": 3000, "tax_slab": 5, "sale_unit": "Strip"},
    {"name": "Omeprazole 20mg", "qty": 300, "unit_price": 12, "discount": 10, "subtotal": 3240, "tax_slab": 12, "sale_unit": "Strip"}
  ],
  "grand_total": 10040,
  "paid_amount": 0,
  "payment_method": "Bank Transfer",
  "notes": "Urgent order for pharmacy restocking. Deliver before month end.",
  "status": "Pending",
  "custom_fields": {}
}' "PO-2026-0001"

post "purchase-orders" '{
  "po_number": "PO-2026-0002",
  "vendor_name": "SurgiTech Equipment",
  "vendor_phone": "9123456789",
  "vendor_email": "sales@surgitech.in",
  "vendor_address": "B-12 Industrial Estate, Pune",
  "shipping_address": "MedSystem Hospital, OT Block",
  "order_date": "2026-05-18",
  "delivery_date": "2026-06-01",
  "items": [
    {"name": "Surgical Gloves (Box of 100)", "qty": 50, "unit_price": 450, "discount": 0, "subtotal": 22500, "tax_slab": 18, "sale_unit": "Box"},
    {"name": "N95 Masks (Box of 50)", "qty": 30, "unit_price": 800, "discount": 5, "subtotal": 22800, "tax_slab": 18, "sale_unit": "Box"},
    {"name": "Disposable Syringes 5ml (Pack of 100)", "qty": 20, "unit_price": 350, "discount": 0, "subtotal": 7000, "tax_slab": 12, "sale_unit": "Pack"}
  ],
  "grand_total": 52300,
  "paid_amount": 52300,
  "payment_method": "Bank Transfer",
  "notes": "Monthly consumables order",
  "status": "Delivered",
  "custom_fields": {}
}' "PO-2026-0002"

post "purchase-orders" '{
  "po_number": "PO-2026-0003",
  "vendor_name": "LabChem Supplies",
  "vendor_phone": "9445678901",
  "vendor_email": "info@labchem.in",
  "vendor_address": "75 Anna Salai, Chennai",
  "shipping_address": "MedSystem Hospital, Lab Wing",
  "order_date": "2026-05-22",
  "delivery_date": "2026-05-29",
  "items": [
    {"name": "Blood Collection Tubes (EDTA)", "qty": 200, "unit_price": 15, "discount": 0, "subtotal": 3000, "tax_slab": 18, "sale_unit": "Piece"},
    {"name": "Reagent Kit - CBC", "qty": 10, "unit_price": 2500, "discount": 10, "subtotal": 22500, "tax_slab": 18, "sale_unit": "Kit"},
    {"name": "Microscope Slides (Box of 72)", "qty": 5, "unit_price": 180, "discount": 0, "subtotal": 900, "tax_slab": 18, "sale_unit": "Box"}
  ],
  "grand_total": 26400,
  "paid_amount": 13200,
  "payment_method": "Cheque",
  "notes": "Lab restocking order. Partial payment made.",
  "status": "Approved",
  "custom_fields": {}
}' "PO-2026-0003"

post "purchase-orders" '{
  "po_number": "PO-2026-0004",
  "vendor_name": "NovaCare Biologics",
  "vendor_phone": "9988776655",
  "vendor_email": "procurement@novacare.in",
  "vendor_address": "Sector 15, Gurgaon",
  "shipping_address": "MedSystem Hospital, Pharmacy",
  "order_date": "2026-05-24",
  "delivery_date": "2026-06-05",
  "items": [
    {"name": "Insulin Glargine 100IU/ml", "qty": 100, "unit_price": 850, "discount": 5, "subtotal": 80750, "tax_slab": 5, "sale_unit": "Vial"},
    {"name": "Metformin 500mg", "qty": 2000, "unit_price": 2, "discount": 0, "subtotal": 4000, "tax_slab": 5, "sale_unit": "Tablet"}
  ],
  "grand_total": 84750,
  "paid_amount": 0,
  "payment_method": "Net-30",
  "notes": "Diabetes medication bulk order",
  "status": "draft",
  "custom_fields": {}
}' "PO-2026-0004"


# ═══════════════════════════════════════════════════════════════════════════════
# 7. SALES ORDERS
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "═══ Creating Sales Orders ═══"

post "sales-orders" '{
  "so_number": "SO-2026-0001",
  "customer_name": "City General Hospital",
  "customer_email": "pharmacy@citygeneral.org",
  "customer_phone": "9876540001",
  "customer_address": "12 Hospital Road, Mumbai 400001",
  "shipping_address": "City General Hospital, Pharmacy Block",
  "billing_address": "12 Hospital Road, Mumbai 400001",
  "order_date": "2026-05-20",
  "delivery_date": "2026-05-25",
  "due_date": "2026-06-20",
  "items": [
    {"name": "Ambroxol 30mg", "qty": 200, "unit_price": 10, "discount": 5, "subtotal": 1900, "tax_slab": 12, "sale_unit": "Box"},
    {"name": "Cetirizine 10mg", "qty": 500, "unit_price": 5, "discount": 0, "subtotal": 2500, "tax_slab": 12, "sale_unit": "Strip"}
  ],
  "grand_total": 4400,
  "paid_amount": 4400,
  "payment_method": "Bank Transfer",
  "payment_status": "Paid",
  "status": "Delivered",
  "notes": "Regular monthly supply to City General",
  "custom_fields": {}
}' "SO-2026-0001"

post "sales-orders" '{
  "so_number": "SO-2026-0002",
  "customer_name": "Apollo Clinic (Banjara Hills)",
  "customer_email": "purchase@apollobh.com",
  "customer_phone": "9876540002",
  "customer_address": "45 Road No 10, Banjara Hills, Hyderabad",
  "shipping_address": "Apollo Clinic, Banjara Hills, Hyderabad",
  "order_date": "2026-05-22",
  "delivery_date": "2026-05-28",
  "due_date": "2026-06-22",
  "items": [
    {"name": "Surgical Gloves (Box of 100)", "qty": 20, "unit_price": 500, "discount": 0, "subtotal": 10000, "tax_slab": 18, "sale_unit": "Box"},
    {"name": "Disposable Syringes 5ml", "qty": 50, "unit_price": 350, "discount": 10, "subtotal": 15750, "tax_slab": 12, "sale_unit": "Pack"},
    {"name": "Paracetamol 650mg", "qty": 300, "unit_price": 3, "discount": 0, "subtotal": 900, "tax_slab": 5, "sale_unit": "Strip"}
  ],
  "grand_total": 26650,
  "paid_amount": 13325,
  "payment_method": "Cheque",
  "payment_status": "Partial",
  "status": "Approved",
  "notes": "Quarterly consumables order",
  "custom_fields": {}
}' "SO-2026-0002"

post "sales-orders" '{
  "so_number": "SO-2026-0003",
  "customer_name": "Rainbow Childrens Hospital",
  "customer_email": "store@rainbowhospital.in",
  "customer_phone": "9876540003",
  "customer_address": "Marathahalli, Bengaluru 560037",
  "shipping_address": "Rainbow Childrens Hospital, Central Store",
  "order_date": "2026-05-24",
  "delivery_date": "2026-05-31",
  "due_date": "2026-06-24",
  "items": [
    {"name": "Amoxicillin Syrup 125mg/5ml", "qty": 100, "unit_price": 45, "discount": 0, "subtotal": 4500, "tax_slab": 5, "sale_unit": "Bottle"},
    {"name": "ORS Sachets", "qty": 500, "unit_price": 8, "discount": 5, "subtotal": 3800, "tax_slab": 5, "sale_unit": "Sachet"}
  ],
  "grand_total": 8300,
  "paid_amount": 0,
  "payment_method": "Net-30",
  "payment_status": "Pending",
  "status": "Pending",
  "notes": "Pediatric medicines for Q2",
  "custom_fields": {}
}' "SO-2026-0003"


# ═══════════════════════════════════════════════════════════════════════════════
# 8. STOCK TRANSFERS
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "═══ Creating Stock Transfers ═══"

post "stock/transfers" '{
  "transfer_number": "ST-2026-001",
  "from_location_id": "main_warehouse",
  "from_location": "Main Warehouse",
  "to_location_id": "pharmacy_1",
  "to_location": "Pharmacy Block 1",
  "items": [
    {"name": "Paracetamol 650mg", "qty": 200, "unit": "Strip"},
    {"name": "Amoxicillin 500mg", "qty": 100, "unit": "Strip"},
    {"name": "Omeprazole 20mg", "qty": 50, "unit": "Strip"}
  ],
  "status": "Completed",
  "notes": "Weekly pharmacy restocking",
  "priority": "high",
  "expected_date": "2026-05-21",
  "custom_fields": {}
}' "ST-2026-001"

post "stock/transfers" '{
  "transfer_number": "ST-2026-002",
  "from_location_id": "main_warehouse",
  "from_location": "Main Warehouse",
  "to_location_id": "ot_store",
  "to_location": "OT Store Room",
  "items": [
    {"name": "Surgical Gloves (Box of 100)", "qty": 10, "unit": "Box"},
    {"name": "Disposable Syringes 5ml", "qty": 15, "unit": "Pack"},
    {"name": "Sterile Gauze Pads", "qty": 20, "unit": "Pack"}
  ],
  "status": "In Transit",
  "notes": "OT supply replenishment",
  "priority": "high",
  "expected_date": "2026-05-25",
  "custom_fields": {}
}' "ST-2026-002"

post "stock/transfers" '{
  "transfer_number": "ST-2026-003",
  "from_location_id": "pharmacy_1",
  "from_location": "Pharmacy Block 1",
  "to_location_id": "emergency_store",
  "to_location": "Emergency Department Store",
  "items": [
    {"name": "Adrenaline 1mg/ml Injection", "qty": 20, "unit": "Ampoule"},
    {"name": "Normal Saline 500ml", "qty": 50, "unit": "Bottle"},
    {"name": "Dextrose 5% 500ml", "qty": 30, "unit": "Bottle"}
  ],
  "status": "Pending",
  "notes": "Emergency department critical stock",
  "priority": "low",
  "expected_date": "2026-05-26",
  "custom_fields": {}
}' "ST-2026-003"


# ═══════════════════════════════════════════════════════════════════════════════
# 9. STOCK ADJUSTMENTS
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "═══ Creating Stock Adjustments ═══"

post "stock/adjustments" '{
  "adjustment_number": "ADJ-2026-001",
  "location_id": "main_warehouse",
  "location": "Main Warehouse",
  "items": [
    {"name": "Expired Amoxicillin 500mg", "qty": -50, "reason": "Expired stock disposal", "unit": "Strip"},
    {"name": "Damaged Surgical Gloves", "qty": -5, "reason": "Damaged in transit", "unit": "Box"}
  ],
  "status": "completed",
  "notes": "Monthly expired/damaged stock writeoff - May 2026",
  "custom_fields": {}
}' "ADJ-2026-001"

post "stock/adjustments" '{
  "adjustment_number": "ADJ-2026-002",
  "location_id": "pharmacy_1",
  "location": "Pharmacy Block 1",
  "items": [
    {"name": "Paracetamol 650mg", "qty": 15, "reason": "Found during audit (unrecorded donation)", "unit": "Strip"},
    {"name": "Cetirizine 10mg", "qty": -3, "reason": "Broken packaging", "unit": "Strip"}
  ],
  "status": "completed",
  "notes": "Post-audit reconciliation",
  "custom_fields": {}
}' "ADJ-2026-002"


# ═══════════════════════════════════════════════════════════════════════════════
# Now get IDs for relational data (admissions, diagnostics)
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "═══ Fetching IDs for relational records ═══"

# Get patient IDs
PATIENTS_JSON=$(curl -sf "$API/patients" -H "$AUTH" | node -e "
let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
  const j=JSON.parse(d);
  const data=j.data||j.items||j;
  const result=data.map(p=>({id:p._id||p.id, name:p.first_name+' '+p.last_name, patient_id:p.patient_id}));
  console.log(JSON.stringify(result));
})")
echo "Patients: $(echo $PATIENTS_JSON | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).length))")"

# Get doctor IDs
DOCTORS_JSON=$(curl -sf "$API/doctors" -H "$AUTH" | node -e "
let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
  const j=JSON.parse(d);
  const data=j.data||j.items||j;
  const result=data.map(d=>({id:d._id||d.id, name:d.name, employee_id:d.employee_id}));
  console.log(JSON.stringify(result));
})")
echo "Doctors: $(echo $DOCTORS_JSON | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).length))")"

# Get room IDs
ROOMS_JSON=$(curl -sf "$API/rooms" -H "$AUTH" | node -e "
let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
  const j=JSON.parse(d);
  const data=j.data||j.items||j;
  const result=data.map(r=>({id:r._id||r.id, number:r.room_number}));
  console.log(JSON.stringify(result));
})")
echo "Rooms: $(echo $ROOMS_JSON | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).length))")"

# Get diagnostic test IDs
TESTS_JSON=$(curl -sf "$API/diagnostics/tests" -H "$AUTH" | node -e "
let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
  const j=JSON.parse(d);
  const data=j.data||j.items||j;
  const result=data.map(t=>({id:t._id||t.id, name:t.name, code:t.test_code, price:t.price}));
  console.log(JSON.stringify(result));
})")
echo "Tests: $(echo $TESTS_JSON | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).length))")"

# Extract specific IDs
PAT1=$(echo $PATIENTS_JSON | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d)[0]?.id||''))")
PAT2=$(echo $PATIENTS_JSON | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d)[1]?.id||''))")
PAT3=$(echo $PATIENTS_JSON | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d)[2]?.id||''))")
PAT4=$(echo $PATIENTS_JSON | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d)[4]?.id||JSON.parse(d)[3]?.id||''))")

DOC1=$(echo $DOCTORS_JSON | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d)[0]?.id||''))")
DOC2=$(echo $DOCTORS_JSON | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d)[1]?.id||''))")
DOC3=$(echo $DOCTORS_JSON | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d)[2]?.id||''))")

ROOM1=$(echo $ROOMS_JSON | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d)[0]?.id||''))")
ROOM2=$(echo $ROOMS_JSON | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d)[1]?.id||''))")
ROOM3=$(echo $ROOMS_JSON | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d)[2]?.id||''))")

TEST1=$(echo $TESTS_JSON | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d)[0]?.id||''))")
TEST2=$(echo $TESTS_JSON | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d)[3]?.id||JSON.parse(d)[1]?.id||''))")
TEST3=$(echo $TESTS_JSON | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d)[5]?.id||JSON.parse(d)[2]?.id||''))")
TEST4=$(echo $TESTS_JSON | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d)[8]?.id||JSON.parse(d)[1]?.id||''))")

echo "Using: PAT1=$PAT1 DOC1=$DOC1 ROOM1=$ROOM1 TEST1=$TEST1"


# ═══════════════════════════════════════════════════════════════════════════════
# 10. ADMISSIONS
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "═══ Creating Admissions ═══"

if [ -n "$PAT1" ] && [ -n "$DOC1" ] && [ -n "$ROOM1" ]; then
  post "admissions" "{
    \"patient_id\": \"$PAT1\",
    \"room_id\": \"$ROOM1\",
    \"doctor_id\": \"$DOC1\",
    \"admission_date\": \"2026-05-18T10:00:00.000Z\",
    \"expected_discharge_date\": \"2026-05-25T10:00:00.000Z\",
    \"admission_type\": \"planned\",
    \"status\": \"active\",
    \"notes\": \"Planned cardiac evaluation and monitoring\",
    \"payment_mode\": \"insurance\",
    \"insurance_provider\": \"Star Health Insurance\",
    \"insurance_policy_no\": \"SHI-2026-445566\",
    \"custom_fields\": {}
  }" "Admission - Patient 1 (Active)"
fi

if [ -n "$PAT2" ] && [ -n "$DOC2" ] && [ -n "$ROOM2" ]; then
  post "admissions" "{
    \"patient_id\": \"$PAT2\",
    \"room_id\": \"$ROOM2\",
    \"doctor_id\": \"$DOC2\",
    \"admission_date\": \"2026-05-20T14:30:00.000Z\",
    \"expected_discharge_date\": \"2026-05-28T10:00:00.000Z\",
    \"admission_type\": \"emergency\",
    \"status\": \"active\",
    \"notes\": \"Emergency admission - acute abdominal pain\",
    \"payment_mode\": \"cash\",
    \"custom_fields\": {}
  }" "Admission - Patient 2 (Emergency)"
fi

if [ -n "$PAT3" ] && [ -n "$DOC1" ] && [ -n "$ROOM3" ]; then
  post "admissions" "{
    \"patient_id\": \"$PAT3\",
    \"room_id\": \"$ROOM3\",
    \"doctor_id\": \"$DOC1\",
    \"admission_date\": \"2026-05-15T09:00:00.000Z\",
    \"expected_discharge_date\": \"2026-05-19T10:00:00.000Z\",
    \"actual_discharge_date\": \"2026-05-19T11:30:00.000Z\",
    \"admission_type\": \"day_care\",
    \"status\": \"discharged\",
    \"discharge_summary\": \"Patient recovered well post minor procedure. Follow-up in 2 weeks.\",
    \"notes\": \"Day care procedure - laparoscopic cholecystectomy\",
    \"payment_mode\": \"card\",
    \"custom_fields\": {}
  }" "Admission - Patient 3 (Discharged)"
fi


# ═══════════════════════════════════════════════════════════════════════════════
# 11. DIAGNOSTIC BOOKINGS
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "═══ Creating Diagnostic Bookings ═══"

if [ -n "$PAT1" ] && [ -n "$DOC1" ] && [ -n "$TEST1" ]; then
  post "diagnostics/bookings" "{
    \"patient_id\": \"$PAT1\",
    \"test_id\": \"$TEST1\",
    \"ordered_by_doctor_id\": \"$DOC1\",
    \"scheduled_date\": \"2026-05-25T09:00:00.000Z\",
    \"scheduled_time\": \"09:00 AM\",
    \"status\": \"scheduled\",
    \"priority\": \"routine\",
    \"notes\": \"Pre-operative blood work\"
  }" "Booking - Patient 1 / CBC"
fi

if [ -n "$PAT1" ] && [ -n "$DOC1" ] && [ -n "$TEST3" ]; then
  post "diagnostics/bookings" "{
    \"patient_id\": \"$PAT1\",
    \"test_id\": \"$TEST3\",
    \"ordered_by_doctor_id\": \"$DOC1\",
    \"scheduled_date\": \"2026-05-25T09:30:00.000Z\",
    \"scheduled_time\": \"09:30 AM\",
    \"status\": \"scheduled\",
    \"priority\": \"routine\",
    \"notes\": \"Pre-operative ECG\"
  }" "Booking - Patient 1 / ECG"
fi

if [ -n "$PAT2" ] && [ -n "$DOC2" ] && [ -n "$TEST2" ]; then
  post "diagnostics/bookings" "{
    \"patient_id\": \"$PAT2\",
    \"test_id\": \"$TEST2\",
    \"ordered_by_doctor_id\": \"$DOC2\",
    \"scheduled_date\": \"2026-05-24T10:00:00.000Z\",
    \"status\": \"in_progress\",
    \"priority\": \"urgent\",
    \"notes\": \"Urgent - evaluate liver function for acute abdomen\"
  }" "Booking - Patient 2 / Thyroid (urgent)"
fi

if [ -n "$PAT4" ] && [ -n "$DOC1" ] && [ -n "$TEST4" ]; then
  post "diagnostics/bookings" "{
    \"patient_id\": \"$PAT4\",
    \"test_id\": \"$TEST4\",
    \"ordered_by_doctor_id\": \"$DOC1\",
    \"scheduled_date\": \"2026-05-22T14:00:00.000Z\",
    \"completed_date\": \"2026-05-22T14:45:00.000Z\",
    \"status\": \"completed\",
    \"priority\": \"routine\",
    \"results\": \"HbA1c: 7.2% - Fair control. Recommend dietary adjustment.\",
    \"notes\": \"Diabetes monitoring\"
  }" "Booking - Patient 4 / HbA1c (completed)"
fi

if [ -n "$PAT3" ] && [ -n "$DOC3" ] && [ -n "$TEST1" ]; then
  post "diagnostics/bookings" "{
    \"patient_id\": \"$PAT3\",
    \"test_id\": \"$TEST1\",
    \"ordered_by_doctor_id\": \"$DOC3\",
    \"ordered_date\": \"2026-05-20T10:00:00.000Z\",
    \"scheduled_date\": \"2026-05-20T11:00:00.000Z\",
    \"completed_date\": \"2026-05-20T11:30:00.000Z\",
    \"status\": \"completed\",
    \"priority\": \"routine\",
    \"results\": \"WBC: 7,200/μL, RBC: 4.8M/μL, Hb: 13.5g/dL, Plt: 245K/μL - All values within normal limits.\",
    \"notes\": \"Pre-discharge routine labs\"
  }" "Booking - Patient 3 / CBC (completed)"
fi


# ═══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ Data seeding complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Created:"
echo "  • 5 Tax configurations"
echo "  • 5 Vendors"
echo "  • 12 Diagnostic tests (catalog)"
echo "  • 6 Additional patients"
echo "  • 5 Additional rooms (ICU, Deluxe, Private, Suite)"
echo "  • 4 Purchase orders (draft, pending, approved, delivered)"
echo "  • 3 Sales orders (pending, partial-paid, delivered)"
echo "  • 3 Stock transfers (pending, in-transit, completed)"
echo "  • 2 Stock adjustments"
echo "  • 3 Admissions (2 active, 1 discharged)"
echo "  • 5 Diagnostic bookings (scheduled, in-progress, completed)"
echo ""
echo "Login: admin / Admin123! → http://localhost:8080"
echo ""
