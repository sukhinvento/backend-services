import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';

export class CreatePatientMedicationDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsString()
  patient_id: string;

  @ApiProperty({ description: 'Medication ID' })
  @IsString()
  medication_id: string;

  @ApiProperty({ description: 'Prescribing doctor ID' })
  @IsString()
  prescribed_by_doctor_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dosage_instructions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  duration_days?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ enum: ['active', 'completed', 'discontinued'] })
  @IsOptional()
  @IsEnum(['active', 'completed', 'discontinued'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  total_cost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
