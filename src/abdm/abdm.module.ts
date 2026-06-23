import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AbdmController } from './abdm.controller';
import { AbdmService } from './abdm.service';
import { AbdmConfigService } from './abdm-config.service';
import { AbdmMockService } from './abdm-mock.service';
import { AbdmLiveService } from './abdm-live.service';
import { FhirService } from './fhir/fhir.service';
import { AbdmCareContext, AbdmCareContextSchema } from './schemas/abdm-care-context.schema';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    CommonModule,
    MongooseModule.forFeature([
      { name: AbdmCareContext.name, schema: AbdmCareContextSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  controllers: [AbdmController],
  providers: [
    AbdmService,
    AbdmConfigService,
    AbdmMockService,
    AbdmLiveService,
    FhirService,
  ],
  exports: [AbdmService, AbdmConfigService, FhirService],
})
export class AbdmModule {}
