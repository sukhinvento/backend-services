import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = 'mongodb://root:rootpassword@localhost:27017/medsystem?authSource=admin';
const DEFAULT_TENANT_ID = 'default_tenant';

async function seedOrders() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    const db = client.db('medsystem');
    console.log('✓ Connected to MongoDB');

    // Get vendors and inventory items
    const vendorCollection = db.collection('vendors') as any;
    const inventoryCollection = db.collection('inventoryitems') as any;
    
    const vendors = await vendorCollection.find({ status: 'active' }).limit(4).toArray();
    const items = await inventoryCollection.find({ tenantId: DEFAULT_TENANT_ID }).limit(20).toArray();

    console.log(`\n📦 Creating Purchase Orders with ${vendors.length} vendors and ${items.length} items...`);
    const poCollection = db.collection('purchase_orders') as any;

    const pos = [
      {
        po_number: 'PO-2024-001',
        vendor_id: vendors[0]?._id || new ObjectId(),
        vendor_name: vendors[0]?.vendor_name || 'PharmaCorp Inc',
        order_date: new Date(),
        expected_delivery_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        line_items: [
          { sku: items[0]?.sku, item_name: items[0]?.name, quantity: 500, unit_price: items[0]?.unit_price || 10, discount_percent: 5 },
          { sku: items[1]?.sku, item_name: items[1]?.name, quantity: 300, unit_price: items[1]?.unit_price || 15, discount_percent: 0 },
          { sku: items[2]?.sku, item_name: items[2]?.name, quantity: 200, unit_price: items[2]?.unit_price || 25, discount_percent: 5 },
        ],
        status: 'pending',
        sub_total: 0,
        tax_amount: 0,
        shipping_cost: 500,
        grand_total: 0,
        tenantId: DEFAULT_TENANT_ID,
        createdBy: 'admin',
        createdAt: new Date(),
      },
      {
        po_number: 'PO-2024-002',
        vendor_id: vendors[1]?._id || new ObjectId(),
        vendor_name: vendors[1]?.vendor_name || 'MediSupply Ltd',
        order_date: new Date(),
        expected_delivery_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        line_items: [
          { sku: items[3]?.sku, item_name: items[3]?.name, quantity: 1000, unit_price: items[3]?.unit_price || 5, discount_percent: 10 },
          { sku: items[4]?.sku, item_name: items[4]?.name, quantity: 600, unit_price: items[4]?.unit_price || 8, discount_percent: 0 },
        ],
        status: 'pending',
        sub_total: 0,
        tax_amount: 0,
        shipping_cost: 300,
        grand_total: 0,
        tenantId: DEFAULT_TENANT_ID,
        createdBy: 'admin',
        createdAt: new Date(),
      },
      {
        po_number: 'PO-2024-003',
        vendor_id: vendors[2]?._id || new ObjectId(),
        vendor_name: vendors[2]?.vendor_name || 'HealthCare Distributors',
        order_date: new Date(),
        expected_delivery_date: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
        line_items: [
          { sku: items[5]?.sku, item_name: items[5]?.name, quantity: 400, unit_price: items[5]?.unit_price || 12, discount_percent: 0 },
          { sku: items[6]?.sku, item_name: items[6]?.name, quantity: 350, unit_price: items[6]?.unit_price || 18, discount_percent: 5 },
          { sku: items[7]?.sku, item_name: items[7]?.name, quantity: 450, unit_price: items[7]?.unit_price || 20, discount_percent: 0 },
          { sku: items[8]?.sku, item_name: items[8]?.name, quantity: 200, unit_price: items[8]?.unit_price || 30, discount_percent: 10 },
        ],
        status: 'pending',
        sub_total: 0,
        tax_amount: 0,
        shipping_cost: 750,
        grand_total: 0,
        tenantId: DEFAULT_TENANT_ID,
        createdBy: 'admin',
        createdAt: new Date(),
      },
    ];

    // Calculate totals for each PO
    for (const po of pos) {
      po.sub_total = po.line_items.reduce((sum, item: any) => {
        const itemTotal = item.quantity * item.unit_price;
        return sum + itemTotal - (itemTotal * item.discount_percent / 100);
      }, 0);
      po.tax_amount = Math.round(po.sub_total * 0.18); // 18% GST
      po.grand_total = po.sub_total + po.tax_amount + po.shipping_cost;
    }

    for (const po of pos) {
      const existing = await poCollection.findOne({ po_number: po.po_number });
      if (!existing) {
        await poCollection.insertOne(po);
        console.log(`  ✓ ${po.po_number} - ${po.vendor_name} (₹${po.grand_total.toFixed(2)})`);
      }
    }

    // Create Sales Orders
    console.log(`\n📋 Creating Sales Orders...`);
    const soCollection = db.collection('sales_orders') as any;

    const customers = [
      { name: 'City General Hospital', id: new ObjectId() },
      { name: 'Apollo Clinic Chain', id: new ObjectId() },
      { name: 'Medicare Nursing Home', id: new ObjectId() },
    ];

    const sos = [
      {
        so_number: 'SO-2024-001',
        customer_id: customers[0].id,
        customer_name: customers[0].name,
        order_date: new Date(),
        delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        line_items: [
          { sku: items[0]?.sku, item_name: items[0]?.name, quantity: 100, unit_price: items[0]?.unit_price * 1.3 || 13, discount_percent: 2 },
          { sku: items[1]?.sku, item_name: items[1]?.name, quantity: 80, unit_price: items[1]?.unit_price * 1.3 || 19.5, discount_percent: 0 },
        ],
        status: 'pending',
        sub_total: 0,
        tax_amount: 0,
        shipping_cost: 200,
        grand_total: 0,
        tenantId: DEFAULT_TENANT_ID,
        createdBy: 'admin',
        createdAt: new Date(),
      },
      {
        so_number: 'SO-2024-002',
        customer_id: customers[1].id,
        customer_name: customers[1].name,
        order_date: new Date(),
        delivery_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        line_items: [
          { sku: items[3]?.sku, item_name: items[3]?.name, quantity: 200, unit_price: items[3]?.unit_price * 1.3 || 6.5, discount_percent: 5 },
          { sku: items[4]?.sku, item_name: items[4]?.name, quantity: 150, unit_price: items[4]?.unit_price * 1.3 || 10.4, discount_percent: 0 },
          { sku: items[9]?.sku, item_name: items[9]?.name, quantity: 120, unit_price: items[9]?.unit_price * 1.3 || 26, discount_percent: 2 },
        ],
        status: 'pending',
        sub_total: 0,
        tax_amount: 0,
        shipping_cost: 300,
        grand_total: 0,
        tenantId: DEFAULT_TENANT_ID,
        createdBy: 'admin',
        createdAt: new Date(),
      },
      {
        so_number: 'SO-2024-003',
        customer_id: customers[2].id,
        customer_name: customers[2].name,
        order_date: new Date(),
        delivery_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        line_items: [
          { sku: items[5]?.sku, item_name: items[5]?.name, quantity: 75, unit_price: items[5]?.unit_price * 1.3 || 15.6, discount_percent: 0 },
          { sku: items[6]?.sku, item_name: items[6]?.name, quantity: 90, unit_price: items[6]?.unit_price * 1.3 || 23.4, discount_percent: 3 },
          { sku: items[10]?.sku, item_name: items[10]?.name, quantity: 110, unit_price: items[10]?.unit_price * 1.3 || 26, discount_percent: 5 },
          { sku: items[11]?.sku, item_name: items[11]?.name, quantity: 60, unit_price: items[11]?.unit_price * 1.3 || 36.4, discount_percent: 0 },
        ],
        status: 'pending',
        sub_total: 0,
        tax_amount: 0,
        shipping_cost: 400,
        grand_total: 0,
        tenantId: DEFAULT_TENANT_ID,
        createdBy: 'admin',
        createdAt: new Date(),
      },
    ];

    // Calculate totals for each SO
    for (const so of sos) {
      so.sub_total = so.line_items.reduce((sum, item: any) => {
        const itemTotal = item.quantity * item.unit_price;
        return sum + itemTotal - (itemTotal * item.discount_percent / 100);
      }, 0);
      so.tax_amount = Math.round(so.sub_total * 0.18); // 18% GST
      so.grand_total = so.sub_total + so.tax_amount + so.shipping_cost;
    }

    for (const so of sos) {
      const existing = await soCollection.findOne({ so_number: so.so_number });
      if (!existing) {
        await soCollection.insertOne(so);
        console.log(`  ✓ ${so.so_number} - ${so.customer_name} (₹${so.grand_total.toFixed(2)})`);
      }
    }

    console.log('\n✅ Orders seeding completed successfully!');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

seedOrders();
