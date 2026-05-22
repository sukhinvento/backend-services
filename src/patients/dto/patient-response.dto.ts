import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PatientResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  patient_id: string;

  @ApiProperty()
  first_name: string;

  @ApiProperty()
  last_name: string;

  @ApiPropertyOptional()
  gender?: string;

  @ApiPropertyOptional()
  dob?: string;

  @ApiPropertyOptional()
  blood_group?: string;

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional()
  department?: string;

  @ApiPropertyOptional()
  allergies?: string[];

  @ApiPropertyOptional()
  existing_conditions?: string[];

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
