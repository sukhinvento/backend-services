import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AssignLocationDto {
  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  location_id: string;

  @ApiPropertyOptional({ example: 'Main Pharmacy' })
  @IsString()
  location_name: string;

  @ApiPropertyOptional({ example: 'Shelf A3' })
  @IsOptional()
  @IsString()
  sub_location?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsNumber()
  @Min(0)
  quantity: number;
}
