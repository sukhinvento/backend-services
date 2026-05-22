import { PartialType } from '@nestjs/swagger';
import { CreatePatientDiagnosticDto } from './create-patient-diagnostic.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class UpdatePatientDiagnosticDto extends PartialType(CreatePatientDiagnosticDto) {
  @ApiPropertyOptional({ enum: ['ordered', 'scheduled', 'in_progress', 'completed', 'cancelled'] })
  @IsOptional()
  @IsEnum(['ordered', 'scheduled', 'in_progress', 'completed', 'cancelled'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  results?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  result_file_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  completed_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  technician_id?: string;
}
