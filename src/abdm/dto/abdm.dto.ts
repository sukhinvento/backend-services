import { IsString, IsEnum, IsOptional, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateAadhaarOtpDto {
  @ApiProperty({ example: '123456789012', description: '12-digit Aadhaar number' })
  @IsString()
  @Length(12, 12)
  @Matches(/^\d{12}$/, { message: 'Aadhaar must be exactly 12 digits' })
  aadhaarNumber: string;
}

export class VerifyOtpDto {
  @ApiProperty({ description: 'Transaction ID from generateAadhaarOtp' })
  @IsString()
  txnId: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP' })
  @IsString()
  @Length(6, 6)
  otp: string;
}

export class SearchAbhaDto {
  @ApiProperty({ example: 'john.doe@abdm', description: 'ABHA address or 14-digit number' })
  @IsString()
  abhaAddress: string;
}

export class InitLinkingOtpDto {
  @ApiProperty({ example: 'john.doe@abdm' })
  @IsString()
  abhaAddress: string;
}

export class ConfirmLinkingDto {
  @ApiProperty()
  @IsString()
  txnId: string;

  @ApiProperty()
  @IsString()
  @Length(6, 6)
  otp: string;
}

export class AddCareContextDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiProperty()
  @IsString()
  abhaAddress: string;

  @ApiProperty({ enum: ['admission', 'diagnostic', 'opd', 'prescription'] })
  @IsEnum(['admission', 'diagnostic', 'opd', 'prescription'])
  contextType: string;

  @ApiProperty({ example: 'ADM-2026-001' })
  @IsString()
  referenceNumber: string;

  @ApiProperty({ example: 'IPD Admission - 3 Jun 2026' })
  @IsString()
  display: string;
}

export class UpdateTenantAbdmConfigDto {
  @ApiPropertyOptional({ description: 'Enable/disable ABDM for this tenant' })
  @IsOptional()
  abdm_enabled?: boolean;

  @ApiPropertyOptional({ description: 'Use mock mode for this tenant' })
  @IsOptional()
  abdm_mock?: boolean;
}
