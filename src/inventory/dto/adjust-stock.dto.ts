import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsEnum, IsOptional } from 'class-validator';

export class AdjustStockDto {
  @ApiProperty({ description: 'Quantity to adjust' })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ description: 'Reason for adjustment' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ enum: ['add', 'subtract'] })
  @IsEnum(['add', 'subtract'])
  adjustment_type: 'add' | 'subtract';
}
