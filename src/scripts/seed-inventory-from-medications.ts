import { MongoClient } from 'mongodb';

const MONGO_URI = 'mongodb://root:rootpassword@localhost:27017/medsystem?authSource=admin';
const DEFAULT_TENANT_ID = 'default_tenant';

async function seedInventory() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    const db = client.db('medsystem');
    console.log('✓ Connected to MongoDB');

    // Get all medications
    const medicationCollection = db.collection('medications') as any;
    const medications = await medicationCollection.find({}).toArray();

    console.log(`\n📦 Creating Inventory Items from ${medications.length} Medications...`);
    const inventoryCollection = db.collection('inventory_items') as any;

    for (const med of medications) {
      const sku = med.drug_code;
      
      // Safe date handling
      let expiryDate = '2027-12-31';
      try {
        if (med.expiry_date) {
          const dateObj = new Date(med.expiry_date);
          if (!isNaN(dateObj.getTime())) {
            expiryDate = dateObj.toISOString().split('T')[0];
          }
        }
      } catch (e) {
        // Use default date if parsing fails
      }

      const inventoryItem = {
        sku: sku,
        name: `${med.generic_name} - ${med.dosage}`,
        category: 'Pharmaceutical',
        description: `Brand: ${med.brand_name} | Manufacturer: ${med.manufacturer}`,
        unit_of_measure: 'Tablet/Capsule',
        sale_unit: 'Box',
        unit_price: med.unit_price || 0,
        current_stock: med.stock_quantity || 0,
        min_stock_level: Math.floor((med.stock_quantity || 0) * 0.2),
        max_stock_level: (med.stock_quantity || 0) * 2,
        reorder_quantity: Math.floor((med.stock_quantity || 0) * 0.5),
        supplier: med.manufacturer,
        manufacturer: med.manufacturer,
        location: 'Pharmacy Shelf A',
        batch_number: `BATCH-${new Date().getTime()}`,
        expiry_date: expiryDate,
        is_active: true,
        tenantId: DEFAULT_TENANT_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const existing = await inventoryCollection.findOne({ sku: sku, tenantId: DEFAULT_TENANT_ID });
      if (!existing) {
        await inventoryCollection.insertOne(inventoryItem);
        console.log(`  ✓ ${inventoryItem.name}`);
      }
    }

    console.log('\n✅ Inventory seeding completed successfully!');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

seedInventory();
