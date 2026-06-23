import { Module } from '@nestjs/common';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { VendorQueryService } from './services/vendor-query.service';
import { TenantsModule } from '@tenants/tenants.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Vendor, VendorSchema } from './schemas/vendor.schema';
import { AuthModule } from '@auth/auth.module';
import { CommonModule } from '@common/common.module';
import { TaxModule } from '../tax/tax.module';
@Module({
  imports: [
    TenantsModule,
    AuthModule,
    CommonModule,
    TaxModule,
    MongooseModule.forFeature([{ name: Vendor.name, schema: VendorSchema }]),
  ],
  controllers: [VendorsController],
  providers: [VendorsService, VendorQueryService],
})
export class VendorsModule {}
