import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateBankAccountDto {
  @ApiProperty({ example: 'State Bank of India' })
  @IsString()
  @IsNotEmpty()
  bank_name: string;

  @ApiProperty({ example: '12345678901234' })
  @IsString()
  @IsNotEmpty()
  account_number: string;

  @ApiPropertyOptional({ example: 'SBIN0001234' })
  @IsOptional()
  @IsString()
  ifsc_code?: string;

  @ApiProperty({ enum: ['savings', 'current', 'overdraft'], example: 'current' })
  @IsEnum(['savings', 'current', 'overdraft'])
  account_type: string;

  @ApiPropertyOptional({ description: 'Linked Chart of Accounts entry ID' })
  @IsOptional()
  @IsString()
  linked_account_id?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  balance?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
