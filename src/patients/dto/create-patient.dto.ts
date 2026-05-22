import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

export class CreatePatientDto {
  @ApiPropertyOptional({ description: 'Patient ID (auto-generated if not provided)' })
  @IsOptional()
  @IsString()
  patient_id?: string;

  @ApiProperty({ description: 'First name' })
  @IsString()
  first_name: string;

  @ApiProperty({ description: 'Last name' })
  @IsString()
  last_name: string;

  @ApiPropertyOptional({ description: 'Gender' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ description: 'Date of birth' })
  @IsOptional()
  @IsString()
  dob?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Phone search hash (HMAC)' })
  @IsOptional()
  @IsString()
  phone_search_hash?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Email search hash' })
  @IsOptional()
  @IsString()
  email_search_hash?: string;

  @ApiPropertyOptional({ description: 'Address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Blood group' })
  @IsOptional()
  @IsString()
  blood_group?: string;

  @ApiPropertyOptional({ description: 'Emergency contact name' })
  @IsOptional()
  @IsString()
  emergency_contact_name?: string;

  @ApiPropertyOptional({ description: 'Emergency contact phone' })
  @IsOptional()
  @IsString()
  emergency_contact_phone?: string;

  @ApiPropertyOptional({ description: 'Allergies', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiPropertyOptional({ description: 'Existing conditions', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  existing_conditions?: string[];

  @ApiPropertyOptional({ description: 'Barcode' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ description: 'RFID tag' })
  @IsOptional()
  @IsString()
  rfid_tag?: string;

  @ApiPropertyOptional({
    description: 'Patient status',
    enum: ['active', 'admitted', 'discharged', 'deceased'],
  })
  @IsOptional()
  @IsEnum(['active', 'admitted', 'discharged', 'deceased'])
  status?: string;

  @ApiPropertyOptional({ description: 'Department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Assigned doctor ID' })
  @IsOptional()
  @IsString()
  assigned_doctor_id?: string;

  @ApiPropertyOptional({ description: 'Custom fields' })
  @IsOptional()
  custom_fields?: Record<string, any>;
}
