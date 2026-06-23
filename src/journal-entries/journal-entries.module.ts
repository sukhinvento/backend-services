import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JournalEntry, JournalEntrySchema } from './schemas/journal-entry.schema';
import { JournalEntriesController } from './journal-entries.controller';
import { JournalEntriesService } from './journal-entries.service';
import { AuthModule } from '@auth/auth.module';
import { CommonModule } from '@common/common.module';
import { AuditModule } from '@audit/audit.module';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: JournalEntry.name, schema: JournalEntrySchema }]),
    AuthModule,
    CommonModule,
    AuditModule,
    AccountsModule,
  ],
  controllers: [JournalEntriesController],
  providers: [JournalEntriesService],
  exports: [JournalEntriesService],
})
export class JournalEntriesModule {}
