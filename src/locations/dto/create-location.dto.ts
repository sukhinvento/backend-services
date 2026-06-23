import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubLocationDto {
  @IsString()
  name: string;

  @IsEnum(['shelf', 'drawer', 'rack', 'bin'])
  type: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  capacity?: number;
}

export class CreateLocationDto {
  @ApiPropertyOptional({ example: 'Main Pharmacy' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'LOC-001' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'pharmacy', enum: ['warehouse', 'pharmacy', 'clinic', 'hospital', 'store'] })
  @IsEnum(['warehouse', 'pharmacy', 'clinic', 'hospital', 'store'])
  type: string;

  @ApiPropertyOptional({ example: 'Building A, Ground Floor' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Mumbai' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Maharashtra' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '400001' })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional({ example: 'Dr. Sharma' })
  @IsOptional()
  @IsString()
  contact_person?: string;

  @ApiPropertyOptional({ example: '+91-9876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'pharmacy@hospital.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ type: [SubLocationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubLocationDto)
  sub_locations?: SubLocationDto[];

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  custom_fields?: Record<string, any>;
}
