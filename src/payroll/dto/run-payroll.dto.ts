import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class RunPayrollDto {
  @ApiProperty({
    description: 'Payroll period in YYYY-MM format',
    example: '2026-06',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'payroll_period must be in YYYY-MM format' })
  payroll_period: string;
}
