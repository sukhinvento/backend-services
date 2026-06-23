import { Module } from '@nestjs/common';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders.service';
import { TenantsModule } from '@tenants/tenants.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PurchaseOrder,
  PurchaseOrderSchema,
} from './schemas/purchase-order.schema';
import { InventoryItem, InventoryItemSchema } from '../inventory/schemas/inventory-item.schema';
import { InventoryLocation, InventoryLocationSchema } from '../inventory/schemas/inventory-location.schema';
import { InventoryBatch, InventoryBatchSchema } from '../inventory/schemas/inventory-batch.schema';
import { AuthModule } from '@auth/auth.module';
import { CommonModule } from '@common/common.module';
import { KafkaModule } from '@kafka/kafka.module';
import { InvoicesModule } from '@invoices/invoices.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TenantsModule,
    AuthModule,
    CommonModule,
    KafkaModule,
    InvoicesModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: PurchaseOrder.name, schema: PurchaseOrderSchema },
      { name: InventoryItem.name, schema: InventoryItemSchema },
      { name: InventoryLocation.name, schema: InventoryLocationSchema },
      { name: InventoryBatch.name, schema: InventoryBatchSchema },
    ]),
  ],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
