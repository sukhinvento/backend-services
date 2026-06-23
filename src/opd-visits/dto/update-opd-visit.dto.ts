import { IsString, IsOptional, IsNumber, IsEnum, IsObject, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOpdVisitDto {
  @ApiPropertyOptional({ enum: ['waiting', 'in_consultation', 'completed', 'cancelled'] })
  @IsOptional()
  @IsEnum(['waiting', 'in_consultation', 'completed', 'cancelled'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  consultation_notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prescription_notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  follow_up_date?: string;

  @ApiPropertyOptional()
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
  @IsNumber()
  consultation_fee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  chief_complaint?: string;

  @ApiPropertyOptional()
  @IsOptional()
  custom_fields?: Record<string, any>;
}

export class UpdateOpdVisitStatusDto {
  @ApiPropertyOptional({ enum: ['waiting', 'in_consultation', 'completed', 'cancelled'] })
  @IsEnum(['waiting', 'in_consultation', 'completed', 'cancelled'])
  status: string;
}
