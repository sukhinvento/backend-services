import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';

export class CreatePatientDiagnosticDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsString()
  patient_id: string;

  @ApiProperty({ description: 'Diagnostic test ID' })
  @IsString()
  test_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ordered_by_doctor_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  ordered_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduled_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scheduled_time?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  completed_date?: string;

  @ApiPropertyOptional({ enum: ['ordered', 'pending', 'scheduled', 'in_progress', 'completed', 'cancelled'] })
  @IsOptional()
  @IsEnum(['ordered', 'pending', 'scheduled', 'in_progress', 'completed', 'cancelled'])
  status?: string;

  @ApiPropertyOptional({ enum: ['routine', 'urgent', 'emergency', 'stat'] })
  @IsOptional()
  @IsEnum(['routine', 'urgent', 'emergency', 'stat'])
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  results?: string;
}
