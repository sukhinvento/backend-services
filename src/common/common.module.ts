import { Module } from '@nestjs/common';
import { QueryBuilderService } from './services/query-builder.service';
import { CryptoModule } from './crypto/crypto.module';
import { AuditHttpInterceptor } from './interceptors/audit-http.interceptor';

@Module({
  imports: [CryptoModule],
  providers: [QueryBuilderService, AuditHttpInterceptor],
  exports: [QueryBuilderService, CryptoModule, AuditHttpInterceptor],
})
export class CommonModule {}
