import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, IsEnum } from 'class-validator';

export class ScheduleSlotDto {
  @IsString()
  day: string;

  @IsString()
  start_time: string;

  @IsString()
  end_time: string;
}

export class CreateDoctorDto {
  @ApiProperty({ description: 'Employee ID (unique per tenant)' })
  @IsString()
  employee_id: string;

  @ApiProperty({ description: 'Doctor name' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dob?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone_search_hash?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email_search_hash?: string;

  @ApiProperty({ description: 'Department' })
  @IsString()
  department: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialisation?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  qualification?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  experience_years?: number;

  @ApiPropertyOptional({ enum: ['active', 'on_leave', 'inactive'] })
  @IsOptional()
  @IsEnum(['active', 'on_leave', 'inactive'])
  status?: string;

  @ApiPropertyOptional({ type: [ScheduleSlotDto] })
  @IsOptional()
  @IsArray()
  schedule?: ScheduleSlotDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  consultation_fee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  opd_slots_per_day?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  join_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registration_no?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  custom_fields?: Record<string, any>;
}
