import { Module } from '@nestjs/common';
import { FulfillmentsController } from './fulfillments.controller';
import { FulfillmentsService } from './fulfillments.service';
import { TenantsModule } from '@tenants/tenants.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Fulfillment, FulfillmentSchema } from './schemas/fulfillment.schema';
import { AuthModule } from '@auth/auth.module';
import { CommonModule } from '@common/common.module';

@Module({
  imports: [
    TenantsModule,
    AuthModule,
    CommonModule,
    MongooseModule.forFeature([{ name: Fulfillment.name, schema: FulfillmentSchema }]),
  ],
  controllers: [FulfillmentsController],
  providers: [FulfillmentsService],
})
export class FulfillmentsModule {}
