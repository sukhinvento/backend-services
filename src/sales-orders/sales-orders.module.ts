import { Module } from '@nestjs/common';
import { SalesOrdersController } from './sales-orders.controller';
import { SalesOrdersService } from './sales-orders.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SalesOrder, SalesOrderSchema } from './schemas/sales-order.schema';
import { InventoryItem, InventoryItemSchema } from '../inventory/schemas/inventory-item.schema';
import { InventoryLocation, InventoryLocationSchema } from '../inventory/schemas/inventory-location.schema';
import { AuthModule } from '@auth/auth.module';
import { CommonModule } from '@common/common.module';
import { KafkaModule } from '@kafka/kafka.module';
import { InvoicesModule } from '@invoices/invoices.module';

@Module({
  imports: [
    AuthModule,
    CommonModule,
    KafkaModule,
    InvoicesModule,
    MongooseModule.forFeature([
      { name: SalesOrder.name, schema: SalesOrderSchema },
      { name: InventoryItem.name, schema: InventoryItemSchema },
      { name: InventoryLocation.name, schema: InventoryLocationSchema },
    ]),
  ],
  controllers: [SalesOrdersController],
  providers: [SalesOrdersService],
})
export class SalesOrdersModule {}
