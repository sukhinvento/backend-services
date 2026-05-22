import { Module } from '@nestjs/common';
import { QueryBuilderService } from './services/query-builder.service';
import { CryptoModule } from './crypto/crypto.module';

@Module({
  imports: [CryptoModule],
  providers: [QueryBuilderService],
  exports: [QueryBuilderService, CryptoModule],
})
export class CommonModule {}
