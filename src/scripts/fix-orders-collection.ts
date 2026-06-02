import { MongoClient } from 'mongodb';

const MONGO_URI = 'mongodb://root:rootpassword@localhost:27017/medsystem?authSource=admin';

async function fixOrders() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    const db = client.db('medsystem');
    console.log('✓ Connected to MongoDB');

    // Fix Purchase Orders
    console.log('\n📦 Fixing Purchase Orders collection...');
    const wrongPOName = 'purchase_orders';
    const correctPOName = 'purchaseorders';
    const wrongPOCol = db.collection(wrongPOName) as any;
    const correctPOCol = db.collection(correctPOName) as any;
    
    const pos = await wrongPOCol.find({}).toArray();
    console.log(`Found ${pos.length} POs in ${wrongPOName}`);
    
    for (const po of pos) {
      delete po._id;
      const existing = await correctPOCol.findOne({ po_number: po.po_number });
      if (!existing) {
        await correctPOCol.insertOne(po);
        console.log(`  ✓ Moved: ${po.po_number}`);
      }
    }

    // Fix Sales Orders
    console.log('\n📋 Fixing Sales Orders collection...');
    const wrongSOName = 'sales_orders';
    const correctSOName = 'salesorders';
    const wrongSOCol = db.collection(wrongSOName) as any;
    const correctSOCol = db.collection(correctSOName) as any;
    
    const sos = await wrongSOCol.find({}).toArray();
    console.log(`Found ${sos.length} SOs in ${wrongSOName}`);
    
    for (const so of sos) {
      delete so._id;
      const existing = await correctSOCol.findOne({ so_number: so.so_number });
      if (!existing) {
        await correctSOCol.insertOne(so);
        console.log(`  ✓ Moved: ${so.so_number}`);
      }
    }

    console.log('\n✅ Successfully fixed order collections!');

  } catch (error) {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

fixOrders();
