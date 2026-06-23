import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BankAccount, BankAccountSchema } from './schemas/bank-account.schema';
import { BankTransaction, BankTransactionSchema } from './schemas/bank-transaction.schema';
import { BankAccountsController } from './bank-accounts.controller';
import { BankAccountsService } from './bank-accounts.service';
import { AuthModule } from '@auth/auth.module';
import { CommonModule } from '@common/common.module';
import { AuditModule } from '@audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BankAccount.name, schema: BankAccountSchema },
      { name: BankTransaction.name, schema: BankTransactionSchema },
    ]),
    AuthModule,
    CommonModule,
    AuditModule,
  ],
  controllers: [BankAccountsController],
  providers: [BankAccountsService],
  exports: [BankAccountsService],
})
export class BankAccountsModule {}
