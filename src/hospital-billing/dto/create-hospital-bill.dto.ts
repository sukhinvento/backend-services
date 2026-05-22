import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, IsEnum, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class LineItemDto {
  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ enum: ['room_charges', 'procedure', 'medication', 'diagnostic', 'consultation', 'other'] })
  @IsOptional()
  @IsEnum(['room_charges', 'procedure', 'medication', 'diagnostic', 'consultation', 'other'])
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiProperty()
  @IsNumber()
  unit_price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discount_percent?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tax_ids?: string[];
}

export class CreateHospitalBillDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsString()
  patient_id: string;

  @ApiPropertyOptional({ description: 'Admission ID' })
  @IsOptional()
  @IsString()
  admission_id?: string;

  @ApiProperty({ type: [LineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  line_items: LineItemDto[];

  @ApiPropertyOptional({ enum: ['cash', 'insurance', 'card', 'corporate', 'government'] })
  @IsOptional()
  @IsString()
  payment_mode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  due_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
