import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeeSalary, EmployeeSalarySchema } from './schemas/employee-salary.schema';
import { PayrollRun, PayrollRunSchema } from './schemas/payroll-run.schema';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { AuthModule } from '@auth/auth.module';
import { CommonModule } from '@common/common.module';
import { AuditModule } from '@audit/audit.module';
import { JournalEntriesModule } from '../journal-entries/journal-entries.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmployeeSalary.name, schema: EmployeeSalarySchema },
      { name: PayrollRun.name, schema: PayrollRunSchema },
    ]),
    AuthModule,
    CommonModule,
    AuditModule,
    JournalEntriesModule,
  ],
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}
