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
import { PatientsModule } from './patients/patients.module';
import { DoctorsModule } from './doctors/doctors.module';
import { RoomsModule } from './rooms/rooms.module';
import { AdmissionsModule } from './admissions/admissions.module';
import { DiagnosticsModule } from './diagnostics/diagnostics.module';
import { MedicationsModule } from './medications/medications.module';
import { InventoryModule } from './inventory/inventory.module';
import { KafkaModule } from './kafka/kafka.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AbdmModule } from './abdm/abdm.module';
import { OpdVisitsModule } from './opd-visits/opd-visits.module';
import { LocationsModule } from './locations/locations.module';
import { DepartmentsModule } from './departments/departments.module';

// ── Finance modules ───────────────────────────────────────────────────────
import { AccountsModule } from './accounts/accounts.module';
import { JournalEntriesModule } from './journal-entries/journal-entries.module';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';
import { PayrollModule } from './payroll/payroll.module';
import { FixedAssetsModule } from './fixed-assets/fixed-assets.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    DatabaseModule,
    KafkaModule,
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
    PatientsModule,
    DoctorsModule,
    RoomsModule,
    AdmissionsModule,
    DiagnosticsModule,
    MedicationsModule,
    InventoryModule,
    LocationsModule,
    DepartmentsModule,
    NotificationsModule,
    AbdmModule,
    OpdVisitsModule,

    // Finance
    AccountsModule,
    JournalEntriesModule,
    BankAccountsModule,
    PayrollModule,
    FixedAssetsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
