import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';

interface TenantConfig {
  name: string;
  description?: string;
}

class TenantSeeder {
  private tenantModel: Model<TenantDocument>;

  // Default tenants configuration
  private readonly defaultTenants: TenantConfig[] = [
    {
      name: 'default_tenant',
      description: 'Default tenant for development and testing',
    },
    {
      name: 'pharma_inc',
      description: 'Pharmaceutical company tenant',
    },
    {
      name: 'retail_corp',
      description: 'Retail corporation tenant',
    },
    {
      name: 'manufacturing_ltd',
      description: 'Manufacturing company tenant',
    },
  ];

  constructor(tenantModel: Model<TenantDocument>) {
    this.tenantModel = tenantModel;
  }

  async seedTenants(): Promise<void> {
    console.log('🔄 Seeding tenants...');

    for (const tenantConfig of this.defaultTenants) {
      const existingTenant = await this.tenantModel.findOne({
        name: tenantConfig.name,
      });

      if (existingTenant) {
        console.log(
          `   ⚠️  Tenant '${tenantConfig.name}' already exists, skipping...`,
        );
        continue;
      }

      console.log(`   ✅ Creating tenant '${tenantConfig.name}'...`);
      await this.tenantModel.create({
        name: tenantConfig.name,
        createdBy: 'system',
        updatedBy: 'system',
      });
    }

    console.log('✅ Tenants seeded successfully!');
  }

  async listTenants(): Promise<void> {
    console.log('📋 Current tenants in database:');
    const tenants = await this.tenantModel.find({}, { name: 1, createdAt: 1 }).lean();

    if (tenants.length === 0) {
      console.log('   No tenants found in database');
      return;
    }

    tenants.forEach((tenant) => {
      console.log(`   🏢 ${tenant.name}`);
    });
  }

  async createCustomTenant(name: string, description?: string): Promise<void> {
    console.log(`🔄 Creating custom tenant '${name}'...`);

    const existingTenant = await this.tenantModel.findOne({ name });
    if (existingTenant) {
      throw new Error(`Tenant '${name}' already exists`);
    }

    await this.tenantModel.create({
      name,
      createdBy: 'system',
      updatedBy: 'system',
    });

    console.log(`✅ Custom tenant '${name}' created successfully!`);
  }
}

async function main() {
  console.log('🚀 Starting tenant seeding...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const tenantModel = app.get<Model<TenantDocument>>(getModelToken(Tenant.name));
    const seeder = new TenantSeeder(tenantModel);

    // Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'seed':
        await seeder.seedTenants();
        break;

      case 'list':
        await seeder.listTenants();
        break;

      case 'create':
        const [, tenantName, description] = args;
        if (!tenantName) {
          console.error('❌ Usage: npm run seed-tenants create <tenantName> [description]');
          process.exit(1);
        }
        await seeder.createCustomTenant(tenantName, description);
        break;

      default:
        console.log('📖 Available commands:');
        console.log('   npm run seed-tenants seed     - Create default tenants');
        console.log('   npm run seed-tenants list     - List all tenants');
        console.log('   npm run seed-tenants create <name> [description] - Create custom tenant');
        console.log('');
        console.log('📋 Default tenants that will be created:');
        console.log('   🏢 default_tenant - Default tenant for development');
        console.log('   🏢 pharma_inc - Pharmaceutical company tenant');
        console.log('   🏢 retail_corp - Retail corporation tenant');
        console.log('   🏢 manufacturing_ltd - Manufacturing company tenant');
        break;
    }
  } catch (error) {
    console.error('❌ Tenant seeding failed:', error.message);
    process.exit(1);
  } finally {
    await app.close();
    console.log('👋 Tenant seeding completed!');
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
