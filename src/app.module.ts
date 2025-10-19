import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { LoggerModule } from './logger/logger.module';
import { DatabaseModule } from './database/database.module';
import { TenantsModule } from './tenants/tenants.module';
import { VendorsModule } from './vendors/vendors.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { SalesOrdersModule } from './sales-orders/sales-orders.module';
import { InvoicesModule } from './invoices/invoices.module';
import { QuotationsModule } from './quotations/quotations.module';
import { FulfillmentsModule } from './fulfillments/fulfillments.module';
import { StockModule } from './stock/stock.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { CommonModule } from './common/common.module';
import { TaxModule } from './tax/tax.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    DatabaseModule,
    TenantsModule,
    VendorsModule,
    PurchaseOrdersModule,
    SalesOrdersModule,
    InvoicesModule,
    QuotationsModule,
    FulfillmentsModule,
    StockModule,
    TaxModule,
    AuthModule,
    AuditModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
