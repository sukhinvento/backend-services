import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({
    description: 'Name of the tenant',
    example: 'City General Hospital',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  // ── GST / tax registration ─────────────────────────────────────────────
  @ApiPropertyOptional({
    description: 'GSTIN — 15-character GST Identification Number (e.g. 27AAAAA0000A1Z5)',
    example: '27AAAAA0000A1Z5',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
    message: 'Invalid GSTIN format. Expected: 27AAAAA0000A1Z5',
  })
  gstin?: string;

  @ApiPropertyOptional({
    description: 'Legal entity name as registered with GST',
    example: 'City General Hospital Pvt Ltd',
  })
  @IsOptional()
  @IsString()
  legal_name?: string;

  @ApiPropertyOptional({
    description: 'Registered address as per GST registration',
  })
  @IsOptional()
  @IsString()
  registered_address?: string;

  @ApiPropertyOptional({
    description: '2-digit state code (e.g. 27 for Maharashtra, 07 for Delhi)',
    example: '27',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{2}$/, { message: 'State code must be 2 digits (e.g. "27")' })
  state_code?: string;

  @ApiPropertyOptional({
    description: 'PAN number of the entity',
    example: 'AAAAA0000A',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, { message: 'Invalid PAN format. Expected: AAAAA0000A' })
  pan?: string;
}
