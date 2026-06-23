import { Module } from '@nestjs/common';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { TenantsModule } from '@tenants/tenants.module';
import { MongooseModule } from '@nestjs/mongoose';
import { StockTransfer, StockTransferSchema } from './schemas/stock-transfer.schema';
import { StockAdjustment, StockAdjustmentSchema } from './schemas/stock-adjustment.schema';
import { InventoryLocation, InventoryLocationSchema } from '../inventory/schemas/inventory-location.schema';
import { AuthModule } from '@auth/auth.module';
import { CommonModule } from '@common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TenantsModule,
    AuthModule,
    CommonModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: StockTransfer.name, schema: StockTransferSchema },
      { name: StockAdjustment.name, schema: StockAdjustmentSchema },
      { name: InventoryLocation.name, schema: InventoryLocationSchema },
    ]),
  ],
  controllers: [StockController],
  providers: [StockService],
})
export class StockModule {}
