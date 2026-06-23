import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

export class JournalLineDto {
  @ApiProperty({ description: 'Account ID (ObjectId reference)', example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  account_id: string;

  @ApiProperty({ description: 'Account code', example: '1001' })
  @IsString()
  @IsNotEmpty()
  account_code: string;

  @ApiProperty({ description: 'Account name', example: 'Cash and Bank' })
  @IsString()
  @IsNotEmpty()
  account_name: string;

  @ApiPropertyOptional({ description: 'Line description', example: 'Payment received from patient' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Debit amount (0 if credit entry)', example: 5000, default: 0 })
  @IsNumber()
  @Min(0)
  debit: number;

  @ApiProperty({ description: 'Credit amount (0 if debit entry)', example: 0, default: 0 })
  @IsNumber()
  @Min(0)
  credit: number;
}
