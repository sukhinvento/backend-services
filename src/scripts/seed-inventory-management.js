/**
 * Seed script: Inventory Management aligned sample data
 * Run: node src/scripts/seed-inventory-management.js
 *
 * Creates properly linked POs, SOs, and Stock Transfers referencing
 * real inventory items and real vendors.
 */

const BASE = 'http://localhost:3000';

// ── helpers ─────────────────────────────────────────────────────────────────

async function api(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json().catch(() => null);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function fmt(n) {
  return n.toFixed(2);
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Login
  console.log('🔑 Logging in…');
  const auth = await api('POST', '/auth/login', { username: 'admin@company.com', password: 'Admin123!' });
  const token = auth.access_token;
  if (!token) throw new Error('Login failed: ' + JSON.stringify(auth));
  console.log('✅ Logged in');

  // 2. Fetch real inventory items
  console.log('\n📦 Fetching inventory items…');
  const invRaw = await api('GET', '/inventory', null, token);
  const items = (Array.isArray(invRaw) ? invRaw : invRaw.data).map(i => ({
    id: i._id, name: i.name, sku: i.sku, price: i.unit_price,
    stock: i.current_stock, category: i.category,
    unit: i.unit_of_measure || 'pcs',
  }));
  console.log(`   Found ${items.length} items`);

  // 3. Fetch real vendors
  console.log('\n🏢 Fetching vendors…');
  const vRaw = await api('GET', '/vendors?limit=50', null, token);
  const allVendors = (Array.isArray(vRaw) ? vRaw : vRaw.data);

  const TEST_VENDOR_NAMES = ['Test Vendor', 'Sim Test Vendor', 'Browser Test Vendor'];
  const testVendors = allVendors.filter(v => TEST_VENDOR_NAMES.includes(v.name));
  const realVendors = allVendors.filter(v => !TEST_VENDOR_NAMES.includes(v.name));
  console.log(`   ${realVendors.length} real vendors, ${testVendors.length} test vendors to clean up`);

  // 4. Delete test vendors
  for (const v of testVendors) {
    try { await api('DELETE', `/vendors/${v._id}`, null, token); console.log(`   🗑  Deleted test vendor: ${v.name}`); }
    catch (e) { console.warn(`   ⚠️  Could not delete ${v.name}: ${e.message}`); }
  }

  // 5. Delete existing POs, SOs, Stock Transfers
  console.log('\n🧹 Cleaning existing POs, SOs, Stock Transfers…');

  const posRaw = await api('GET', '/purchase-orders?limit=100', null, token);
  const existingPOs = Array.isArray(posRaw) ? posRaw : posRaw.data;
  for (const po of existingPOs) {
    try { await api('DELETE', `/purchase-orders/${po._id}`, null, token); }
    catch (e) { console.warn(`   ⚠️  Cannot delete PO ${po.po_number}: ${e.message}`); }
  }
  console.log(`   Removed ${existingPOs.length} POs`);

  const sosRaw = await api('GET', '/sales-orders?limit=100', null, token);
  const existingSOs = Array.isArray(sosRaw) ? sosRaw : sosRaw.data;
  for (const so of existingSOs) {
    try { await api('DELETE', `/sales-orders/${so._id}`, null, token); }
    catch (e) { console.warn(`   ⚠️  Cannot delete SO ${so.so_number}: ${e.message}`); }
  }
  console.log(`   Removed ${existingSOs.length} SOs`);

  const stRaw = await api('GET', '/stock/transfers?limit=100', null, token);
  const existingSTs = Array.isArray(stRaw) ? stRaw : stRaw.data;
  for (const t of existingSTs) {
    try { await api('DELETE', `/stock/transfers/${t._id}`, null, token); }
    catch (e) { console.warn(`   ⚠️  Cannot delete ST ${t.transfer_number}: ${e.message}`); }
  }
  console.log(`   Removed ${existingSTs.length} stock transfers`);

  // ── Index items by category ──────────────────────────────────────────────
  const byCategory = {};
  for (const item of items) {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  }

  // ── Index vendors by name ────────────────────────────────────────────────
  const vByName = {};
  for (const v of realVendors) vByName[v.name] = v;

  // Vendor → category mapping
  const vendorCatMap = {
    'PharmaCorp India Pvt Ltd':      ['Pharmaceuticals', 'IV Fluids', 'IV & Infusion'],
    'MedEquip Solutions Ltd':        ['Medical Equipment'],
    'Sunrise Surgical Supplies':     ['PPE & Consumables', 'Wound Care'],
    'Apollo Diagnostics Supply Co':  ['Diagnostics'],
    'NovaMed Pharmaceuticals':       ['Pharmaceuticals'],
    'LifeCare PPE & Consumables':    ['PPE & Consumables', 'Sterilization'],
    'BioTech Lab Instruments':       ['Diagnostics', 'Medical Equipment'],
    'MediTest Supplies Ltd':         ['Medical Equipment', 'Pharmaceuticals'],
  };

  // Get vendor id by name (fallback to first real vendor)
  function vendorId(name) {
    return (vByName[name] || realVendors[0])._id;
  }
  function vendorName(name) {
    return (vByName[name] || realVendors[0]).name;
  }

  // Pick N items from categories
  function pickItems(cats, count) {
    const pool = cats.flatMap(c => byCategory[c] || []);
    const result = [];
    for (let i = 0; i < Math.min(count, pool.length); i++) {
      result.push(pool[i % pool.length]);
    }
    return result;
  }

  // Build PO line items
  function poItems(itemList) {
    return itemList.map(item => ({
      item_id: item.id,
      name: item.name,
      sku: item.sku,
      quantity: Math.floor(Math.random() * 40) + 10,
      unit_price: item.price,
      discount_percent: 0,
      tax_ids: [],
    }));
  }

  // Build SO line items
  function soItems(itemList) {
    return itemList.map(item => ({
      item_id: item.id,
      name: item.name,
      sku: item.sku,
      quantity: Math.floor(Math.random() * 10) + 1,
      unit_price: item.price * 1.15, // 15% markup
      discount_percent: 0,
      tax_ids: [],
    }));
  }

  // ── 6. Create Purchase Orders ─────────────────────────────────────────────
  console.log('\n📋 Creating Purchase Orders…');

  const poDefinitions = [
    // Received — oldest, forms the stock backbone
    {
      vendor: 'PharmaCorp India Pvt Ltd',
      order_date: daysAgo(165), delivery_date: daysAgo(150),
      status: 'received',
      cats: ['Pharmaceuticals', 'IV Fluids'],
      notes: 'Q4 2025 pharmaceutical bulk restock',
    },
    {
      vendor: 'MedEquip Solutions Ltd',
      order_date: daysAgo(145), delivery_date: daysAgo(130),
      status: 'received',
      cats: ['Medical Equipment'],
      notes: 'Annual equipment procurement — Q4 2025',
    },
    {
      vendor: 'Sunrise Surgical Supplies',
      order_date: daysAgo(130), delivery_date: daysAgo(115),
      status: 'received',
      cats: ['PPE & Consumables', 'Wound Care'],
      notes: 'PPE winter stock — received in full',
    },
    {
      vendor: 'LifeCare PPE & Consumables',
      order_date: daysAgo(110), delivery_date: daysAgo(95),
      status: 'received',
      cats: ['PPE & Consumables', 'Sterilization'],
      notes: 'Sterilization supplies quarterly order',
    },
    {
      vendor: 'Apollo Diagnostics Supply Co',
      order_date: daysAgo(100), delivery_date: daysAgo(85),
      status: 'received',
      cats: ['Diagnostics'],
      notes: 'Diagnostic consumables — Jan restock',
    },
    // Approved — recently approved, in transit
    {
      vendor: 'PharmaCorp India Pvt Ltd',
      order_date: daysAgo(75), delivery_date: daysAgo(45),
      status: 'approved',
      cats: ['IV & Infusion', 'IV Fluids'],
      notes: 'IV supplies for ICU ward',
    },
    {
      vendor: 'Sunrise Surgical Supplies',
      order_date: daysAgo(60), delivery_date: daysAgo(30),
      status: 'approved',
      cats: ['PPE & Consumables', 'Wound Care'],
      notes: 'Surgical masks and wound care — March order',
    },
    {
      vendor: 'NovaMed Pharmaceuticals',
      order_date: daysAgo(55), delivery_date: daysAgo(25),
      status: 'approved',
      cats: ['Pharmaceuticals'],
      notes: 'Paracetamol and OTC medicines bulk',
    },
    {
      vendor: 'BioTech Lab Instruments',
      order_date: daysAgo(45), delivery_date: daysAgo(15),
      status: 'approved',
      cats: ['Diagnostics', 'Medical Equipment'],
      notes: 'Lab equipment and diagnostic kits',
    },
    // Pending — awaiting approval
    {
      vendor: 'MedEquip Solutions Ltd',
      order_date: daysAgo(30), delivery_date: daysAgo(5),
      status: 'pending',
      cats: ['Medical Equipment'],
      notes: 'Replacement BP monitors and pulse oximeters',
    },
    {
      vendor: 'LifeCare PPE & Consumables',
      order_date: daysAgo(25), delivery_date: daysAgo(0),
      status: 'pending',
      cats: ['PPE & Consumables', 'Sterilization'],
      notes: 'Emergency PPE restock — COVID protocol',
    },
    // Draft — just created
    {
      vendor: 'Apollo Diagnostics Supply Co',
      order_date: daysAgo(10), delivery_date: daysAgo(-15),
      status: 'draft',
      cats: ['Diagnostics'],
      notes: 'Q2 diagnostics reorder — pending review',
    },
    {
      vendor: 'PharmaCorp India Pvt Ltd',
      order_date: daysAgo(7), delivery_date: daysAgo(-20),
      status: 'draft',
      cats: ['Pharmaceuticals', 'IV Fluids'],
      notes: 'June pharmaceutical forecast order',
    },
    {
      vendor: 'Sunrise Surgical Supplies',
      order_date: daysAgo(5), delivery_date: daysAgo(-18),
      status: 'draft',
      cats: ['PPE & Consumables'],
      notes: 'Surgical consumables — June restock draft',
    },
    {
      vendor: 'NovaMed Pharmaceuticals',
      order_date: daysAgo(3), delivery_date: daysAgo(-14),
      status: 'draft',
      cats: ['Pharmaceuticals'],
      notes: 'Monthly pharma reorder',
    },
  ];

  const createdPOs = [];
  for (const def of poDefinitions) {
    const lineItems = poItems(pickItems(def.cats, 3));
    const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);

    const body = {
      vendor_id: vendorId(def.vendor),
      vendor_name: vendorName(def.vendor),
      order_date: def.order_date,
      delivery_date: def.delivery_date,
      status: def.status,
      items: lineItems,
      subtotal: +fmt(subtotal),
      total_tax: 0,
      total_discount: 0,
      grand_total: +fmt(subtotal),
      notes: def.notes,
      shipping_address: 'City General Hospital, Medical Supply Wing, MG Road, Mumbai 400001',
      payment_terms: 'Net 30',
    };

    try {
      const po = await api('POST', '/purchase-orders', body, token);
      // Patch status if non-draft
      if (def.status !== 'draft' && po?._id) {
        try { await api('PATCH', `/purchase-orders/${po._id}`, { status: def.status }, token); } catch (_) {}
      }
      createdPOs.push(po);
      console.log(`   ✅ PO ${po?.po_number} (${def.status}) — ${def.vendor}`);
    } catch (e) {
      console.error(`   ❌ PO failed (${def.vendor}): ${e.message}`);
    }
  }

  // ── 7. Create Sales Orders ────────────────────────────────────────────────
  console.log('\n🛒 Creating Sales Orders…');

  const departments = [
    { name: 'City General Hospital — Cardiology Ward',      email: 'cardiology@citygeneral.in',      phone: '9876543201', addr: 'Block B, City General Hospital, Mumbai' },
    { name: 'Apollo Hospital — Orthopaedics Dept',          email: 'ortho@apollohospital.in',         phone: '9876543202', addr: '4th Floor, Apollo Tower, Navi Mumbai' },
    { name: 'Fortis Healthcare — ICU Supply',               email: 'icu.supply@fortis.in',            phone: '9876543203', addr: 'Fortis Hospital, Mulund West, Mumbai' },
    { name: 'Lilavati Hospital — General Medicine',         email: 'genmedicine@lilavati.in',         phone: '9876543204', addr: 'Lilavati Hospital, Bandra West, Mumbai' },
    { name: 'Kokilaben Hospital — Emergency Wing',          email: 'emergency@kokilaben.in',          phone: '9876543205', addr: 'Kokilaben Ambani Hospital, Andheri West' },
    { name: 'Nanavati Hospital — Pharmacy Dept',            email: 'pharmacy@nanavati.in',            phone: '9876543206', addr: 'Nanavati Hospital, Vile Parle West' },
    { name: 'Sir HN Reliance Foundation Hospital',          email: 'supply@reliancefoundation.in',    phone: '9876543207', addr: 'Prarthana Samaj, Marine Lines, Mumbai' },
  ];

  const soDefinitions = [
    // Delivered — oldest
    { customer: departments[0], order_date: daysAgo(155), status: 'Delivered', payment_status: 'Paid',    cats: ['PPE & Consumables', 'Wound Care'], items_count: 3 },
    { customer: departments[1], order_date: daysAgo(135), status: 'Delivered', payment_status: 'Paid',    cats: ['Medical Equipment', 'Diagnostics'], items_count: 2 },
    { customer: departments[2], order_date: daysAgo(115), status: 'Delivered', payment_status: 'Paid',    cats: ['IV Fluids', 'Pharmaceuticals'], items_count: 3 },
    { customer: departments[3], order_date: daysAgo(95),  status: 'Delivered', payment_status: 'Paid',    cats: ['PPE & Consumables', 'Sterilization'], items_count: 3 },
    { customer: departments[4], order_date: daysAgo(80),  status: 'Delivered', payment_status: 'Partial', cats: ['Wound Care', 'Pharmaceuticals'], items_count: 2 },
    // Invoiced — payment due
    { customer: departments[5], order_date: daysAgo(55),  status: 'Invoiced',  payment_status: 'Pending', cats: ['Medical Equipment', 'Diagnostics'], items_count: 2 },
    { customer: departments[6], order_date: daysAgo(45),  status: 'Invoiced',  payment_status: 'Pending', cats: ['IV Fluids', 'PPE & Consumables'], items_count: 3 },
    { customer: departments[0], order_date: daysAgo(35),  status: 'Invoiced',  payment_status: 'Partial', cats: ['Pharmaceuticals', 'Wound Care'], items_count: 3 },
    // Processing
    { customer: departments[1], order_date: daysAgo(20),  status: 'Processing', payment_status: 'Pending', cats: ['Medical Equipment'], items_count: 2 },
    { customer: departments[2], order_date: daysAgo(15),  status: 'Processing', payment_status: 'Pending', cats: ['Diagnostics', 'PPE & Consumables'], items_count: 3 },
    // Draft
    { customer: departments[3], order_date: daysAgo(7),   status: 'Draft',     payment_status: 'Pending', cats: ['Pharmaceuticals'], items_count: 2 },
    { customer: departments[4], order_date: daysAgo(4),   status: 'Draft',     payment_status: 'Pending', cats: ['PPE & Consumables', 'Sterilization'], items_count: 2 },
  ];

  for (const def of soDefinitions) {
    const lineItems = soItems(pickItems(def.cats, def.items_count));
    const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    const paidAmount = def.payment_status === 'Paid' ? subtotal : def.payment_status === 'Partial' ? subtotal * 0.5 : 0;

    const body = {
      customer_name: def.customer.name,
      customer_email: def.customer.email,
      customer_phone: def.customer.phone,
      customer_address: def.customer.addr,
      shipping_address: def.customer.addr,
      billing_address: def.customer.addr,
      order_date: def.order_date,
      due_date: daysAgo(-30),
      items: lineItems,
      subtotal: +fmt(subtotal),
      total_tax: 0,
      total_discount: 0,
      grand_total: +fmt(subtotal),
      paid_amount: +fmt(paidAmount),
      payment_method: 'Bank Transfer',
      payment_status: def.payment_status,
      status: def.status.toLowerCase(),
      notes: `Order for ${def.customer.name.split('—')[0].trim()}`,
    };

    try {
      const so = await api('POST', '/sales-orders', body, token);
      if (so?._id && def.status !== 'Draft') {
        const statusMap = { 'Processing': 'processing', 'Invoiced': 'invoiced', 'Delivered': 'delivered' };
        try { await api('PATCH', `/sales-orders/${so._id}`, { status: statusMap[def.status] || def.status.toLowerCase() }, token); } catch (_) {}
      }
      console.log(`   ✅ SO ${so?.so_number} (${def.status}) — ${def.customer.name.split('—')[0].trim()}`);
    } catch (e) {
      console.error(`   ❌ SO failed: ${e.message}`);
    }
  }

  // ── 8. Create Stock Transfers ─────────────────────────────────────────────
  console.log('\n🔄 Creating Stock Transfers…');

  const depts = ['General Medicine', 'Cardiology', 'Orthopaedics', 'ICU', 'Emergency', 'Pharmacy', 'Paediatrics', 'Gynaecology'];

  const transferDefinitions = [
    {
      from: 'Pharmacy', to: 'ICU',
      date: daysAgo(90), status: 'completed', priority: 'urgent',
      cats: ['IV Fluids', 'IV & Infusion', 'Pharmaceuticals'],
      notes: 'Emergency ICU resupply — IV fluids critical',
    },
    {
      from: 'Pharmacy', to: 'Emergency',
      date: daysAgo(75), status: 'completed', priority: 'high',
      cats: ['PPE & Consumables', 'Wound Care'],
      notes: 'Emergency ward wound care and PPE restock',
    },
    {
      from: 'General Medicine', to: 'Cardiology',
      date: daysAgo(60), status: 'completed', priority: 'medium',
      cats: ['Medical Equipment', 'Diagnostics'],
      notes: 'BP monitors and diagnostic kits transfer',
    },
    {
      from: 'Pharmacy', to: 'Paediatrics',
      date: daysAgo(50), status: 'completed', priority: 'medium',
      cats: ['Pharmaceuticals', 'PPE & Consumables'],
      notes: 'Paediatrics ward monthly supply',
    },
    {
      from: 'General Medicine', to: 'Orthopaedics',
      date: daysAgo(40), status: 'completed', priority: 'low',
      cats: ['Wound Care', 'Sterilization'],
      notes: 'Post-surgical wound care supplies',
    },
    {
      from: 'Pharmacy', to: 'Gynaecology',
      date: daysAgo(30), status: 'in_transit', priority: 'medium',
      cats: ['Pharmaceuticals', 'IV Fluids'],
      notes: 'Monthly pharma resupply for gynaecology',
    },
    {
      from: 'General Medicine', to: 'ICU',
      date: daysAgo(20), status: 'in_transit', priority: 'high',
      cats: ['Medical Equipment', 'Diagnostics'],
      notes: 'ICU monitoring equipment shift',
    },
    {
      from: 'Pharmacy', to: 'Emergency',
      date: daysAgo(10), status: 'pending', priority: 'urgent',
      cats: ['PPE & Consumables', 'Wound Care'],
      notes: 'Urgent emergency restock request',
    },
    {
      from: 'General Medicine', to: 'Cardiology',
      date: daysAgo(5), status: 'pending', priority: 'medium',
      cats: ['Diagnostics', 'Medical Equipment'],
      notes: 'Cardiology diagnostic kits top-up',
    },
    {
      from: 'Pharmacy', to: 'Paediatrics',
      date: daysAgo(2), status: 'pending', priority: 'low',
      cats: ['Pharmaceuticals', 'PPE & Consumables'],
      notes: 'Routine paediatrics monthly restock',
    },
  ];

  for (const def of transferDefinitions) {
    const pool = def.cats.flatMap(c => byCategory[c] || []).slice(0, 3);
    if (pool.length === 0) { console.warn(`   ⚠️  No items for cats ${def.cats}`); continue; }

    const stItems = pool.map(item => ({
      item_id: item.id,
      name: item.name,
      quantity: Math.floor(Math.random() * 15) + 5,
      sale_unit: item.unit,
    }));

    const body = {
      from_location: def.from,
      to_location: def.to,
      items: stItems,
      notes: def.notes,
      priority: def.priority,
      status: def.status,
      expected_date: daysAgo(-7),
    };

    try {
      const st = await api('POST', '/stock/transfers', body, token);
      if (st?._id && def.status !== 'pending') {
        const statusMap = { completed: 'completed', in_transit: 'in_transit' };
        try { await api('PATCH', `/stock/transfers/${st._id}`, { status: statusMap[def.status] }, token); } catch (_) {}
      }
      console.log(`   ✅ ST ${st?.transfer_number} (${def.priority.toUpperCase()} / ${def.status}) ${def.from} → ${def.to}`);
    } catch (e) {
      console.error(`   ❌ ST failed (${def.from} → ${def.to}): ${e.message}`);
    }
  }

  console.log('\n✅ Seed complete!\n');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
