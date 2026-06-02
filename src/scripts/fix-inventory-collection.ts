import { MongoClient } from 'mongodb';

const MONGO_URI = 'mongodb://root:rootpassword@localhost:27017/medsystem?authSource=admin';

async function fixInventory() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    const db = client.db('medsystem');
    console.log('✓ Connected to MongoDB');

    // Get items from inventory_items collection
    const wrongCollectionName = 'inventory_items';
    const correctCollectionName = 'inventoryitems';
    
    const wrongCollection = db.collection(wrongCollectionName) as any;
    const correctCollection = db.collection(correctCollectionName) as any;

    const items = await wrongCollection.find({}).toArray();
    console.log(`\n📦 Found ${items.length} items in ${wrongCollectionName}`);
    console.log(`✓ Moving to correct collection: ${correctCollectionName}`);

    for (const item of items) {
      // Remove the old _id to let MongoDB generate a new one
      delete item._id;
      const existing = await correctCollection.findOne({ sku: item.sku, tenantId: item.tenantId });
      if (!existing) {
        await correctCollection.insertOne(item);
        console.log(`  ✓ Moved: ${item.name}`);
      } else {
        console.log(`  ⊘ Skipped (already exists): ${item.name}`);
      }
    }

    console.log('\n✅ Successfully moved inventory items to correct collection!');

  } catch (error) {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

fixInventory();
