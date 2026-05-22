import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Vendor, VendorDocument } from '../vendors/schemas/vendor.schema';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';

interface MigrationOptions {
  defaultTenantId: string;
  dryRun: boolean;
  force: boolean;
}

class TenantIdMigration {
  private userModel: Model<UserDocument>;
  private vendorModel: Model<VendorDocument>;
  private tenantModel: Model<TenantDocument>;
  private options: MigrationOptions;

  constructor(
    userModel: Model<UserDocument>,
    vendorModel: Model<VendorDocument>,
    tenantModel: Model<TenantDocument>,
    options: MigrationOptions,
  ) {
    this.userModel = userModel;
    this.vendorModel = vendorModel;
    this.tenantModel = tenantModel;
    this.options = options;
  }

  async validateTenantExists(tenantId: string): Promise<boolean> {
    const tenant = await this.tenantModel.findOne({ name: tenantId }).exec();
    return !!tenant;
  }

  async listAvailableTenants(): Promise<void> {
    console.log('📋 Available tenants:');
    const tenants = await this.tenantModel.find({}, { name: 1 }).lean();
    
    if (tenants.length === 0) {
      console.log('   No tenants found in database');
      console.log('   You need to create tenants first before running migration');
      return;
    }

    tenants.forEach((tenant) => {
      console.log(`   🏢 ${tenant.name}`);
    });
  }

  async migrateUsers(): Promise<void> {
    console.log('🔄 Migrating users...');
    
    const usersWithoutTenant = await this.userModel.find({ 
      tenantId: { $exists: false } 
    }).exec();
    
    console.log(`Found ${usersWithoutTenant.length} users without tenantId`);

    if (usersWithoutTenant.length === 0) {
      console.log('✅ All users already have tenantId');
      return;
    }

    if (this.options.dryRun) {
      console.log('🔍 DRY RUN - Users that would be updated:');
      usersWithoutTenant.forEach(user => {
        console.log(`   👤 ${user.username} → tenantId: ${this.options.defaultTenantId}`);
      });
      return;
    }

    for (const user of usersWithoutTenant) {
      await this.userModel.findByIdAndUpdate(user._id, { 
        tenantId: this.options.defaultTenantId,
        updatedBy: 'migration'
      }).exec();
      console.log(`   ✅ Updated user ${user.username} with tenantId: ${this.options.defaultTenantId}`);
    }

    console.log(`✅ Updated ${usersWithoutTenant.length} users`);
  }

  async migrateVendors(): Promise<void> {
    console.log('🔄 Migrating vendors...');
    
    const vendorsWithoutTenant = await this.vendorModel.find({ 
      tenantId: { $exists: false } 
    }).exec();
    
    console.log(`Found ${vendorsWithoutTenant.length} vendors without tenantId`);

    if (vendorsWithoutTenant.length === 0) {
      console.log('✅ All vendors already have tenantId');
      return;
    }

    if (this.options.dryRun) {
      console.log('🔍 DRY RUN - Vendors that would be updated:');
      vendorsWithoutTenant.forEach(vendor => {
        console.log(`   🏢 ${vendor.name} (${vendor.vendor_code}) → tenantId: ${this.options.defaultTenantId}`);
      });
      return;
    }

    for (const vendor of vendorsWithoutTenant) {
      await this.vendorModel.findByIdAndUpdate(vendor._id, { 
        tenantId: this.options.defaultTenantId,
        updatedBy: 'migration'
      }).exec();
      console.log(`   ✅ Updated vendor ${vendor.name} with tenantId: ${this.options.defaultTenantId}`);
    }

    console.log(`✅ Updated ${vendorsWithoutTenant.length} vendors`);
  }

  async validateMigration(): Promise<void> {
    console.log('🔍 Validating migration...');
    
    const usersWithoutTenant = await this.userModel.countDocuments({ 
      tenantId: { $exists: false } 
    });
    
    const vendorsWithoutTenant = await this.vendorModel.countDocuments({ 
      tenantId: { $exists: false } 
    });

    if (usersWithoutTenant === 0 && vendorsWithoutTenant === 0) {
      console.log('✅ Migration validation passed - all records have tenantId');
    } else {
      console.log(`❌ Migration validation failed:`);
      console.log(`   Users without tenantId: ${usersWithoutTenant}`);
      console.log(`   Vendors without tenantId: ${vendorsWithoutTenant}`);
    }
  }

  async run(): Promise<void> {
    console.log('🚀 Starting tenantId migration...');
    console.log(`   Target tenantId: ${this.options.defaultTenantId}`);
    console.log(`   Dry run: ${this.options.dryRun}`);
    console.log(`   Force: ${this.options.force}`);
    console.log('');

    try {
      // Validate tenant exists
      console.log('🔍 Validating tenant exists...');
      const tenantExists = await this.validateTenantExists(this.options.defaultTenantId);
      
      if (!tenantExists) {
        console.log(`❌ Tenant '${this.options.defaultTenantId}' does not exist!`);
        console.log('');
        await this.listAvailableTenants();
        console.log('');
        throw new Error(`Tenant '${this.options.defaultTenantId}' not found. Please create the tenant first or use an existing tenant.`);
      }
      
      console.log(`✅ Tenant '${this.options.defaultTenantId}' found`);
      console.log('');

      await this.migrateUsers();
      console.log('');
      await this.migrateVendors();
      console.log('');
      await this.validateMigration();
      
      console.log('');
      console.log('🎉 Migration completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    const vendorModel = app.get<Model<VendorDocument>>(getModelToken(Vendor.name));
    const tenantModel = app.get<Model<TenantDocument>>(getModelToken(Tenant.name));

    // Parse command line arguments
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const force = args.includes('--force');
    const listTenants = args.includes('--list-tenants');
    const defaultTenantId = args.find(arg => !arg.startsWith('--')) || 'default_tenant';

    if (listTenants) {
      const migration = new TenantIdMigration(userModel, vendorModel, tenantModel, {
        defaultTenantId: '',
        dryRun: false,
        force: false,
      });
      await migration.listAvailableTenants();
      return;
    }

    if (!force && !dryRun) {
      console.log('⚠️  This will modify your database!');
      console.log('   Use --dry-run to see what would be changed');
      console.log('   Use --force to proceed with the migration');
      console.log('   Use --list-tenants to see available tenants');
      console.log('');
      console.log('Usage: npm run migrate-tenant [tenantId] [--dry-run] [--force] [--list-tenants]');
      process.exit(1);
    }

    const migration = new TenantIdMigration(userModel, vendorModel, tenantModel, {
      defaultTenantId,
      dryRun,
      force,
    });

    await migration.run();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

main();
