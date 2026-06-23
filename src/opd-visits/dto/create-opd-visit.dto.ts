import { IsString, IsOptional, IsNumber, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOpdVisitDto {
  @ApiProperty({ description: 'Patient ObjectId' })
  @IsString()
  patient_id: string;

  @ApiPropertyOptional({ description: 'Patient name (denormalized)' })
  @IsOptional()
  @IsString()
  patient_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  patient_phone?: string;

  @ApiProperty({ description: 'Doctor ObjectId' })
  @IsString()
  doctor_id: string;

  @ApiPropertyOptional({ description: 'Doctor name (denormalized)' })
  @IsOptional()
  @IsString()
  doctor_name?: string;

  @ApiProperty({ description: 'Department name', example: 'Cardiology' })
  @IsString()
  department: string;

  @ApiProperty({ description: 'Reason for visit', example: 'Chest pain and breathlessness' })
  @IsString()
  chief_complaint: string;

  @ApiPropertyOptional({ description: 'Consultation fee (defaults from doctor record)' })
  @IsOptional()
  @IsNumber()
  consultation_fee?: number;

  @ApiPropertyOptional({ enum: ['cash', 'insurance', 'card', 'corporate', 'government'], default: 'cash' })
  @IsOptional()
  @IsEnum(['cash', 'insurance', 'card', 'corporate', 'government'])
  payment_mode?: string;

  @ApiPropertyOptional({ description: 'Patient vitals recorded by nurse' })
  @IsOptional()
  @IsObject()
  vitals?: {
    bp?: string;
    pulse?: number;
    temperature?: number;
    weight?: number;
    spo2?: number;
  };

  @ApiPropertyOptional()
  @IsOptional()
  custom_fields?: Record<string, any>;
}
