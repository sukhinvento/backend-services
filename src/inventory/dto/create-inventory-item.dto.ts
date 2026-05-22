import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';

export class CreateInventoryItemDto {
  @ApiProperty({ description: 'SKU (unique per tenant)' })
  @IsString()
  sku: string;

  @ApiProperty({ description: 'Item name' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit_of_measure?: string;

  @ApiPropertyOptional({ description: 'Minimum sale unit (Single Unit, Strip, Box, Bottle, Vial, Pack, Sachet)' })
  @IsOptional()
  @IsString()
  sale_unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  unit_price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  current_stock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  min_stock_level?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  max_stock_level?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  reorder_quantity?: number;

  @ApiPropertyOptional({ description: 'Supplier display name' })
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiPropertyOptional({ description: 'Supplier ID (ObjectId reference)' })
  @IsOptional()
  @IsString()
  supplier_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batch_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expiry_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rfid_tag?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicable_tax_ids?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  custom_fields?: Record<string, any>;
}
