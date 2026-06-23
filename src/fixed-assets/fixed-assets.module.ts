import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FixedAsset, FixedAssetSchema } from './schemas/fixed-asset.schema';
import { FixedAssetsController } from './fixed-assets.controller';
import { FixedAssetsService } from './fixed-assets.service';
import { AuthModule } from '@auth/auth.module';
import { CommonModule } from '@common/common.module';
import { AuditModule } from '@audit/audit.module';
import { JournalEntriesModule } from '../journal-entries/journal-entries.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: FixedAsset.name, schema: FixedAssetSchema }]),
    AuthModule,
    CommonModule,
    AuditModule,
    JournalEntriesModule,
  ],
  controllers: [FixedAssetsController],
  providers: [FixedAssetsService],
  exports: [FixedAssetsService],
})
export class FixedAssetsModule {}
