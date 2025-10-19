import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Role, RoleDocument } from '../auth/schemas/role.schema';
import { Tax, TaxDocument } from '../tax/schemas/tax.schema';
import { Role as RoleEnum, Scope } from '../common/enums';
import * as bcrypt from 'bcrypt';

interface AdminUserConfig {
  username: string;
  password: string;
  roles: string[];
}

interface RoleConfig {
  name: string;
  scopes: string[];
}

interface TaxConfig {
  tax_code: string;
  name: string;
  description: string;
  rate: number;
  rate_type: 'percentage' | 'fixed';
  applicable_on: 'sales' | 'purchase' | 'both';
  status: 'active' | 'inactive' | 'archived';
  jurisdiction?: string;
  tax_category?: string;
  priority?: number;
  is_inclusive?: boolean;
  is_compound?: boolean;
  components?: Array<{
    name: string;
    rate: number;
    description?: string;
  }>;
  configuration?: {
    min_amount?: number;
    max_amount?: number;
    exempt_threshold?: number;
    reverse_charge?: boolean;
  };
}

class DatabaseSeeder {
  private userModel: Model<UserDocument>;
  private roleModel: Model<RoleDocument>;
  private taxModel: Model<TaxDocument>;

  // Default roles configuration
  private readonly defaultRoles: RoleConfig[] = [
    {
      name: RoleEnum.ADMIN,
      scopes: [
        // All module permissions for admin
        Scope.TENANTS,
        Scope.VENDORS,
        Scope.INVOICES,
        Scope.PURCHASE_ORDERS,
        Scope.SALES_ORDERS,
        Scope.USER_MANAGEMENT,
        Scope.SYSTEM_ADMIN,
      ],
    },
    {
      name: RoleEnum.MANAGER,
      scopes: [
        // Business modules access for managers
        Scope.TENANTS,
        Scope.VENDORS,
        Scope.INVOICES,
        Scope.PURCHASE_ORDERS,
        Scope.SALES_ORDERS,
      ],
    },
    {
      name: RoleEnum.USER,
      scopes: [
        // Limited module access for regular users
        Scope.VENDORS,
        Scope.INVOICES,
        Scope.PURCHASE_ORDERS,
        Scope.SALES_ORDERS,
      ],
    },
    {
      name: RoleEnum.VIEWER,
      scopes: [
        // Read-only access to basic modules
        Scope.VENDORS,
        Scope.INVOICES,
        Scope.PURCHASE_ORDERS,
        Scope.SALES_ORDERS,
      ],
    },
  ];

  // Default admin users configuration
  private readonly defaultAdminUsers: AdminUserConfig[] = [
    {
      username: 'admin@company.com',
      password: 'Admin123!',
      roles: [RoleEnum.ADMIN],
    },
    {
      username: 'manager@company.com',
      password: 'Manager123!',
      roles: [RoleEnum.MANAGER],
    },
  ];

  // Default tax configurations
  private readonly defaultTaxes: TaxConfig[] = [
    // GST Taxes (India)
    {
      tax_code: 'GST-5',
      name: 'GST 5%',
      description: 'Goods and Services Tax at 5% rate',
      rate: 5,
      rate_type: 'percentage',
      applicable_on: 'both',
      status: 'active',
      jurisdiction: 'India',
      tax_category: 'GST',
      priority: 1,
      is_inclusive: false,
      is_compound: false,
    },
    {
      tax_code: 'GST-12',
      name: 'GST 12%',
      description: 'Goods and Services Tax at 12% rate',
      rate: 12,
      rate_type: 'percentage',
      applicable_on: 'both',
      status: 'active',
      jurisdiction: 'India',
      tax_category: 'GST',
      priority: 1,
      is_inclusive: false,
      is_compound: false,
    },
    {
      tax_code: 'GST-18',
      name: 'GST 18%',
      description: 'Goods and Services Tax at 18% rate',
      rate: 18,
      rate_type: 'percentage',
      applicable_on: 'both',
      status: 'active',
      jurisdiction: 'India',
      tax_category: 'GST',
      priority: 1,
      is_inclusive: false,
      is_compound: false,
    },
    {
      tax_code: 'GST-28',
      name: 'GST 28%',
      description: 'Goods and Services Tax at 28% rate (Luxury goods)',
      rate: 28,
      rate_type: 'percentage',
      applicable_on: 'both',
      status: 'active',
      jurisdiction: 'India',
      tax_category: 'GST',
      priority: 1,
      is_inclusive: false,
      is_compound: false,
    },
    // Compound GST (CGST + SGST)
    {
      tax_code: 'GST-18-COMPOUND',
      name: 'GST 18% (CGST 9% + SGST 9%)',
      description: 'Compound GST with Central and State components',
      rate: 18,
      rate_type: 'percentage',
      applicable_on: 'both',
      status: 'active',
      jurisdiction: 'India',
      tax_category: 'GST',
      priority: 1,
      is_inclusive: false,
      is_compound: false,
      components: [
        { name: 'CGST', rate: 9, description: 'Central GST' },
        { name: 'SGST', rate: 9, description: 'State GST' },
      ],
    },
    {
      tax_code: 'GST-12-COMPOUND',
      name: 'GST 12% (CGST 6% + SGST 6%)',
      description: 'Compound GST with Central and State components',
      rate: 12,
      rate_type: 'percentage',
      applicable_on: 'both',
      status: 'active',
      jurisdiction: 'India',
      tax_category: 'GST',
      priority: 1,
      is_inclusive: false,
      is_compound: false,
      components: [
        { name: 'CGST', rate: 6, description: 'Central GST' },
        { name: 'SGST', rate: 6, description: 'State GST' },
      ],
    },
    // IGST (Inter-state GST)
    {
      tax_code: 'IGST-18',
      name: 'IGST 18%',
      description: 'Integrated GST for inter-state transactions',
      rate: 18,
      rate_type: 'percentage',
      applicable_on: 'both',
      status: 'active',
      jurisdiction: 'India',
      tax_category: 'IGST',
      priority: 1,
      is_inclusive: false,
      is_compound: false,
    },
    // VAT Taxes
    {
      tax_code: 'VAT-20',
      name: 'VAT 20%',
      description: 'Value Added Tax at standard rate',
      rate: 20,
      rate_type: 'percentage',
      applicable_on: 'both',
      status: 'active',
      jurisdiction: 'UK',
      tax_category: 'VAT',
      priority: 1,
      is_inclusive: false,
      is_compound: false,
    },
    {
      tax_code: 'VAT-5',
      name: 'VAT 5%',
      description: 'Value Added Tax at reduced rate',
      rate: 5,
      rate_type: 'percentage',
      applicable_on: 'both',
      status: 'active',
      jurisdiction: 'UK',
      tax_category: 'VAT',
      priority: 1,
      is_inclusive: false,
      is_compound: false,
    },
    {
      tax_code: 'VAT-0',
      name: 'VAT 0% (Zero-rated)',
      description: 'Zero-rated VAT for specific goods',
      rate: 0,
      rate_type: 'percentage',
      applicable_on: 'both',
      status: 'active',
      jurisdiction: 'UK',
      tax_category: 'VAT',
      priority: 1,
      is_inclusive: false,
      is_compound: false,
    },
    // Sales Tax (US)
    {
      tax_code: 'SALES-TAX-7',
      name: 'Sales Tax 7%',
      description: 'State sales tax',
      rate: 7,
      rate_type: 'percentage',
      applicable_on: 'sales',
      status: 'active',
      jurisdiction: 'USA',
      tax_category: 'Sales Tax',
      priority: 1,
      is_inclusive: false,
      is_compound: false,
    },
    {
      tax_code: 'SALES-TAX-10',
      name: 'Sales Tax 10%',
      description: 'Combined state and local sales tax',
      rate: 10,
      rate_type: 'percentage',
      applicable_on: 'sales',
      status: 'active',
      jurisdiction: 'USA',
      tax_category: 'Sales Tax',
      priority: 1,
      is_inclusive: false,
      is_compound: false,
    },
    // Service Tax
    {
      tax_code: 'SERVICE-TAX-15',
      name: 'Service Tax 15%',
      description: 'Tax applicable on services',
      rate: 15,
      rate_type: 'percentage',
      applicable_on: 'both',
      status: 'active',
      tax_category: 'Service Tax',
      priority: 2,
      is_inclusive: false,
      is_compound: false,
    },
    // Fixed Tax
    {
      tax_code: 'ENV-TAX-FIXED',
      name: 'Environmental Tax',
      description: 'Fixed environmental tax per transaction',
      rate: 5,
      rate_type: 'fixed',
      applicable_on: 'both',
      status: 'active',
      tax_category: 'Environmental Tax',
      priority: 3,
      is_inclusive: false,
      is_compound: false,
      configuration: {
        min_amount: 0,
        max_amount: 100,
      },
    },
    // Tax with threshold
    {
      tax_code: 'LUXURY-TAX-10',
      name: 'Luxury Tax 10%',
      description: 'Tax for luxury items above threshold',
      rate: 10,
      rate_type: 'percentage',
      applicable_on: 'sales',
      status: 'active',
      tax_category: 'Luxury Tax',
      priority: 2,
      is_inclusive: false,
      is_compound: false,
      configuration: {
        exempt_threshold: 1000,
      },
    },
  ];

  constructor(
    userModel: Model<UserDocument>,
    roleModel: Model<RoleDocument>,
    taxModel: Model<TaxDocument>,
  ) {
    this.userModel = userModel;
    this.roleModel = roleModel;
    this.taxModel = taxModel;
  }

  async seedRoles(): Promise<void> {
    console.log('🔄 Seeding roles...');

    for (const roleConfig of this.defaultRoles) {
      const existingRole = await this.roleModel.findOne({
        name: roleConfig.name,
      });

      if (existingRole) {
        console.log(
          `   ⚠️  Role '${roleConfig.name}' already exists, updating scopes...`,
        );
        existingRole.scopes = roleConfig.scopes;
        existingRole.updatedBy = 'system';
        await existingRole.save();
      } else {
        console.log(`   ✅ Creating role '${roleConfig.name}'...`);
        await this.roleModel.create({
          name: roleConfig.name,
          scopes: roleConfig.scopes,
          createdBy: 'system',
          updatedBy: 'system',
        });
      }
    }

    console.log('✅ Roles seeded successfully!');
  }

  async seedAdminUsers(): Promise<void> {
    console.log('🔄 Seeding admin users...');

    for (const userConfig of this.defaultAdminUsers) {
      const existingUser = await this.userModel.findOne({
        username: userConfig.username,
      });

      if (existingUser) {
        console.log(
          `   ⚠️  User '${userConfig.username}' already exists, skipping...`,
        );
        continue;
      }

      console.log(`   ✅ Creating user '${userConfig.username}'...`);

      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userConfig.password, saltRounds);

      // Create the user
      await this.userModel.create({
        username: userConfig.username,
        password_hash: hashedPassword,
        roles: userConfig.roles,
        createdBy: 'system',
        updatedBy: 'system',
      });

      console.log(
        `   🔐 User '${userConfig.username}' created with hashed password`,
      );
    }

    console.log('✅ Admin users seeded successfully!');
  }

  async createCustomUser(
    username: string,
    password: string,
    roles: string[],
  ): Promise<void> {
    console.log(`🔄 Creating custom user '${username}'...`);

    const existingUser = await this.userModel.findOne({ username });
    if (existingUser) {
      throw new Error(`User '${username}' already exists`);
    }

    // Validate roles exist
    for (const roleName of roles) {
      const role = await this.roleModel.findOne({ name: roleName });
      if (!role) {
        throw new Error(
          `Role '${roleName}' does not exist. Please create roles first.`,
        );
      }
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create the user
    await this.userModel.create({
      username,
      password_hash: hashedPassword,
      roles,
      createdBy: 'system',
      updatedBy: 'system',
    });

    console.log(`✅ Custom user '${username}' created successfully!`);
  }

  async listUsers(): Promise<void> {
    console.log('📋 Current users in database:');
    const users = await this.userModel.find({}, { password_hash: 0 }).lean();

    if (users.length === 0) {
      console.log('   No users found in database');
      return;
    }

    users.forEach((user) => {
      console.log(`   👤 ${user.username} - Roles: [${user.roles.join(', ')}]`);
    });
  }

  async listRoles(): Promise<void> {
    console.log('📋 Current roles in database:');
    const roles = await this.roleModel.find({}).lean();

    if (roles.length === 0) {
      console.log('   No roles found in database');
      return;
    }

    roles.forEach((role) => {
      console.log(
        `   🎭 ${role.name} - Scopes: ${role.scopes.length} permissions`,
      );
    });
  }

  async seedTaxes(): Promise<void> {
    console.log('🔄 Seeding taxes...');

    for (const taxConfig of this.defaultTaxes) {
      const existingTax = await this.taxModel.findOne({
        tax_code: taxConfig.tax_code,
      });

      if (existingTax) {
        console.log(
          `   ⚠️  Tax '${taxConfig.tax_code}' already exists, updating...`,
        );
        Object.assign(existingTax, taxConfig);
        existingTax.updatedBy = 'system';
        await existingTax.save();
      } else {
        console.log(`   ✅ Creating tax '${taxConfig.tax_code}'...`);
        await this.taxModel.create({
          ...taxConfig,
          createdBy: 'system',
          updatedBy: 'system',
        });
      }
    }

    console.log('✅ Taxes seeded successfully!');
  }

  async listTaxes(): Promise<void> {
    console.log('📋 Current taxes in database:');
    const taxes = await this.taxModel.find({}).lean();

    if (taxes.length === 0) {
      console.log('   No taxes found in database');
      return;
    }

    console.log(`   Found ${taxes.length} taxes:`);
    taxes.forEach((tax) => {
      const components = tax.components?.length
        ? ` (${tax.components.map((c) => c.name).join(' + ')})`
        : '';
      console.log(
        `   💰 ${tax.tax_code} - ${tax.name} [${tax.rate}${tax.rate_type === 'percentage' ? '%' : ' fixed'}]${components} - ${tax.status}`,
      );
    });
  }
}

async function main() {
  console.log('🚀 Starting database seeding...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    const roleModel = app.get<Model<RoleDocument>>(getModelToken(Role.name));
    const taxModel = app.get<Model<TaxDocument>>(getModelToken(Tax.name));

    const seeder = new DatabaseSeeder(userModel, roleModel, taxModel);

    // Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'roles':
        await seeder.seedRoles();
        break;

      case 'users':
        await seeder.seedAdminUsers();
        break;

      case 'all':
        await seeder.seedRoles();
        await seeder.seedAdminUsers();
        await seeder.seedTaxes();
        break;

      case 'taxes':
        await seeder.seedTaxes();
        break;

      case 'list-taxes':
        await seeder.listTaxes();
        break;

      case 'create-user':
        const [, username, password, ...roles] = args;
        if (!username || !password || roles.length === 0) {
          console.error(
            '❌ Usage: npm run seed create-user <username> <password> <role1> [role2] [role3]',
          );
          process.exit(1);
        }
        await seeder.createCustomUser(username, password, roles);
        break;

      case 'list-users':
        await seeder.listUsers();
        break;

      case 'list-roles':
        await seeder.listRoles();
        break;

      default:
        console.log('📖 Available commands:');
        console.log(
          '   npm run seed roles          - Create/update default roles',
        );
        console.log(
          '   npm run seed users          - Create default admin users',
        );
        console.log(
          '   npm run seed taxes          - Create/update default taxes',
        );
        console.log('   npm run seed all            - Create roles, users, and taxes');
        console.log(
          '   npm run seed create-user <username> <password> <role1> [role2] - Create custom user',
        );
        console.log('   npm run seed list-users     - List all users');
        console.log('   npm run seed list-roles     - List all roles');
        console.log('   npm run seed list-taxes     - List all taxes');
        console.log('');
        console.log('📋 Default users that will be created:');
        console.log(
          '   👤 admin@company.com (password: Admin123!) - Role: admin',
        );
        console.log(
          '   👤 manager@company.com (password: Manager123!) - Role: manager',
        );
        console.log('');
        console.log('💰 Default taxes that will be created:');
        console.log('   GST: 5%, 12%, 18%, 28% (India)');
        console.log('   VAT: 0%, 5%, 20% (UK)');
        console.log('   Sales Tax: 7%, 10% (USA)');
        console.log('   IGST, Service Tax, Environmental Tax, Luxury Tax');
        console.log('');
        console.log(
          '🔐 Available roles: admin, manager, user, finance, procurement, sales',
        );
        break;
    }
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await app.close();
    console.log('👋 Database seeding completed!');
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
