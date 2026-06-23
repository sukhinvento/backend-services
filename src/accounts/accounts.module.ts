import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from './schemas/account.schema';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { AuthModule } from '@auth/auth.module';
import { CommonModule } from '@common/common.module';
import { AuditModule } from '@audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]),
    AuthModule,
    CommonModule,
    AuditModule,
  ],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
