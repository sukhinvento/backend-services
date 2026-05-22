import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class AdjustmentItemDto {
  @IsOptional()
  @IsString()
  item_id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  quantity_delta?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateStockAdjustmentDto {
  @ApiPropertyOptional({ description: 'Unique adjustment number', example: 'ADJ-2024-001' })
  @IsOptional()
  @IsString()
  adjustment_number?: string;

  @ApiPropertyOptional({ description: 'Location ID for adjustment', example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsString()
  location_id?: string;

  @ApiPropertyOptional({ description: 'Location name', example: 'Main Warehouse' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'List of items to adjust',
    type: [Object],
  })
  @IsOptional()
  @IsArray()
  @Type(() => AdjustmentItemDto)
  items?: AdjustmentItemDto[];

  @ApiPropertyOptional({
    description: 'Adjustment status',
    example: 'draft',
    enum: ['draft', 'pending', 'applied', 'cancelled'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Reason for adjustment' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Custom fields', type: Object })
  @IsOptional()
  @IsObject()
  custom_fields?: Record<string, any>;
}
