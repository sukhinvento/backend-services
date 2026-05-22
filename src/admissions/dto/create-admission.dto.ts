import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class CreateAdmissionDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsString()
  patient_id: string;

  @ApiProperty({ description: 'Room ID' })
  @IsString()
  room_id: string;

  @ApiProperty({ description: 'Doctor ID' })
  @IsString()
  doctor_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  admission_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expected_discharge_date?: string;

  @ApiProperty({ enum: ['planned', 'emergency', 'transfer', 'day_care'] })
  @IsEnum(['planned', 'emergency', 'transfer', 'day_care'])
  admission_type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: ['cash', 'insurance', 'card', 'corporate', 'government'] })
  @IsOptional()
  @IsEnum(['cash', 'insurance', 'card', 'corporate', 'government'])
  payment_mode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  insurance_provider?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  insurance_policy_no?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  corporate_account?: string;

  @ApiPropertyOptional()
  @IsOptional()
  custom_fields?: Record<string, any>;
}
