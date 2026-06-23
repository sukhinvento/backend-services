import { Module } from '@nestjs/common';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { TenantsModule } from '@tenants/tenants.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Location, LocationSchema } from './schemas/location.schema';
import { AuthModule } from '@auth/auth.module';
import { CommonModule } from '@common/common.module';

@Module({
  imports: [
    TenantsModule,
    AuthModule,
    CommonModule,
    MongooseModule.forFeature([{ name: Location.name, schema: LocationSchema }]),
  ],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService, MongooseModule],
})
export class LocationsModule {}
