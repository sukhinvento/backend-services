import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  Min,
  IsEnum,
  IsOptional,
} from 'class-validator';

export class CreateFixedAssetDto {
  @ApiProperty({ example: 'FA-001' })
  @IsString()
  @IsNotEmpty()
  asset_code: string;

  @ApiProperty({ example: 'MRI Scanner' })
  @IsString()
  @IsNotEmpty()
  asset_name: string;

  @ApiProperty({ example: 'Medical Equipment' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: '2026-01-15' })
  @IsDateString()
  purchase_date: string;

  @ApiProperty({ example: 5000000 })
  @IsNumber()
  @Min(0)
  purchase_cost: number;

  @ApiProperty({ example: 10, description: 'Useful life in years' })
  @IsNumber()
  @Min(1)
  useful_life_years: number;

  @ApiProperty({ enum: ['straight_line', 'wdv'], example: 'straight_line' })
  @IsEnum(['straight_line', 'wdv'])
  depreciation_method: string;

  @ApiPropertyOptional({ example: 500000, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salvage_value?: number;

  @ApiPropertyOptional({ description: 'Linked asset account ID in CoA' })
  @IsOptional()
  @IsString()
  linked_account_id?: string;

  @ApiPropertyOptional({ description: 'Depreciation expense account ID in CoA' })
  @IsOptional()
  @IsString()
  depreciation_account_id?: string;

  @ApiPropertyOptional({ description: 'Accumulated depreciation contra-asset account ID' })
  @IsOptional()
  @IsString()
  accumulated_depreciation_account_id?: string;
}
