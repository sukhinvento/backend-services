import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { TenantsModule } from '@tenants/tenants.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Invoice, InvoiceSchema } from './schemas/invoice.schema';
import { AuthModule } from '@auth/auth.module';
import { CommonModule } from '@common/common.module';
import { KafkaModule } from '@kafka/kafka.module';
import { InvoicesEventHandler } from './invoices.event-handler';

@Module({
  imports: [
    TenantsModule,
    AuthModule,
    CommonModule,
    KafkaModule,
    MongooseModule.forFeature([{ name: Invoice.name, schema: InvoiceSchema }]),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoicesEventHandler],
  exports: [InvoicesService],
})
export class InvoicesModule {}
