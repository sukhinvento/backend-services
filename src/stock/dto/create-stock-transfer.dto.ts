import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class TransferItemDto {
  @IsOptional()
  @IsString()
  item_id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  quantity?: number;

  @IsOptional()
  unit_cost?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateStockTransferDto {
  @ApiPropertyOptional({ description: 'Unique transfer number', example: 'TRF-2024-001' })
  @IsOptional()
  @IsString()
  transfer_number?: string;

  @ApiPropertyOptional({ description: 'Source location ID', example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsString()
  from_location_id?: string;

  @ApiPropertyOptional({ description: 'Source location name', example: 'Main Warehouse' })
  @IsOptional()
  @IsString()
  from_location?: string;

  @ApiPropertyOptional({ description: 'Destination location ID', example: '507f1f77bcf86cd799439012' })
  @IsOptional()
  @IsString()
  to_location_id?: string;

  @ApiPropertyOptional({ description: 'Destination location name', example: 'Ward B' })
  @IsOptional()
  @IsString()
  to_location?: string;

  @ApiPropertyOptional({
    description: 'List of items to transfer',
    type: [Object],
  })
  @IsOptional()
  @IsArray()
  @Type(() => TransferItemDto)
  items?: TransferItemDto[];

  @ApiPropertyOptional({
    description: 'Transfer status',
    example: 'draft',
    enum: ['draft', 'pending', 'in_transit', 'completed', 'cancelled'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Notes or reason for transfer' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Priority level', enum: ['low', 'medium', 'high', 'urgent'] })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ description: 'Expected completion date' })
  @IsOptional()
  @IsString()
  expected_date?: string;

  @ApiPropertyOptional({ description: 'Custom fields', type: Object })
  @IsOptional()
  @IsObject()
  custom_fields?: Record<string, any>;
}
