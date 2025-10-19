import { Module } from '@nestjs/common';
import { QuotationsController } from './quotations.controller';
import { QuotationsService } from './quotations.service';
import { TenantsModule } from '@tenants/tenants.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Quotation, QuotationSchema } from './schemas/quotation.schema';
import { AuthModule } from '@auth/auth.module';
import { CommonModule } from '@common/common.module';

@Module({
  imports: [
    TenantsModule,
    AuthModule,
    CommonModule,
    MongooseModule.forFeature([{ name: Quotation.name, schema: QuotationSchema }]),
  ],
  controllers: [QuotationsController],
  providers: [QuotationsService],
})
export class QuotationsModule {}
