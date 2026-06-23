import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsBoolean } from 'class-validator';

export class CreateEmployeeSalaryDto {
  @ApiPropertyOptional({ description: 'Doctor / staff ID (ObjectId)' })
  @IsOptional()
  @IsString()
  doctor_id?: string;

  @ApiProperty({ example: 'Dr. Priya Sharma' })
  @IsString()
  @IsNotEmpty()
  employee_name: string;

  @ApiProperty({ example: 'Senior Consultant' })
  @IsString()
  @IsNotEmpty()
  designation: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0)
  basic_salary: number;

  @ApiPropertyOptional({ example: 20000, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hra?: number;

  @ApiPropertyOptional({ example: 10000, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  special_allowance?: number;

  @ApiPropertyOptional({ example: 6000, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pf_deduction?: number;

  @ApiPropertyOptional({ example: 5000, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax_deduction?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
