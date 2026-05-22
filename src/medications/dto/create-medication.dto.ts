import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum } from 'class-validator';

export class CreateMedicationDto {
  @ApiProperty({ description: 'Drug code (unique per tenant)' })
  @IsString()
  drug_code: string;

  @ApiProperty({ description: 'Medication name' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  generic_name?: string;

  @ApiPropertyOptional({ enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'inhaler', 'other'] })
  @IsOptional()
  @IsEnum(['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'inhaler', 'other'])
  dosage_form?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  strength?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  price_per_unit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  stock_quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
