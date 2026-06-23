import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryItem, InventoryItemSchema } from './schemas/inventory-item.schema';
import { InventoryLocation, InventoryLocationSchema } from './schemas/inventory-location.schema';
import { InventoryBatch, InventoryBatchSchema } from './schemas/inventory-batch.schema';
import { AuthModule } from '@auth/auth.module';
import { CommonModule } from '@common/common.module';
import { AuditModule } from '@audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InventoryItem.name, schema: InventoryItemSchema },
      { name: InventoryLocation.name, schema: InventoryLocationSchema },
      { name: InventoryBatch.name, schema: InventoryBatchSchema },
    ]),
    AuthModule,
    CommonModule,
    AuditModule,
    NotificationsModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
