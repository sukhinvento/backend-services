import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ description: 'Department name (unique per tenant)', example: 'Cardiology' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Short code used in token generation', example: 'CARD' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Longer description of the department' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Hex colour for UI badge', example: '#0ea5e9' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive'], default: 'active' })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;

  @IsOptional()
  custom_fields?: Record<string, any>;
}
