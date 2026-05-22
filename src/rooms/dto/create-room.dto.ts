import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, IsEnum } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ description: 'Room number (unique per tenant)' })
  @IsString()
  room_number: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  floor?: number;

  @ApiProperty({ enum: ['general', 'semi_private', 'private', 'icu', 'deluxe', 'suite'] })
  @IsEnum(['general', 'semi_private', 'private', 'icu', 'deluxe', 'suite'])
  type: string;

  @ApiPropertyOptional({ enum: ['available', 'occupied', 'maintenance', 'reserved'] })
  @IsOptional()
  @IsEnum(['available', 'occupied', 'maintenance', 'reserved'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bed_capacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  occupied_beds?: number;

  @ApiProperty({ description: 'Daily rate' })
  @IsNumber()
  daily_rate: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  custom_fields?: Record<string, any>;
}
