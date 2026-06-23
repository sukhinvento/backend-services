import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateBankTransactionDto {
  @ApiProperty({ description: 'Transaction date', example: '2026-06-05' })
  @IsDateString()
  transaction_date: string;

  @ApiProperty({ description: 'Transaction description', example: 'Payment to vendor XYZ' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Reference / cheque number', example: 'CHQ-0042' })
  @IsOptional()
  @IsString()
  reference_number?: string;

  @ApiProperty({ description: 'Debit amount (money out)', example: 5000, default: 0 })
  @IsNumber()
  @Min(0)
  debit: number;

  @ApiProperty({ description: 'Credit amount (money in)', example: 0, default: 0 })
  @IsNumber()
  @Min(0)
  credit: number;

  @ApiPropertyOptional({ description: 'Linked journal entry ID' })
  @IsOptional()
  @IsString()
  journal_entry_id?: string;
}
