import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Username for the new user',
    example: 'john.doe@company.com',
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: 'Plain text password for the user',
    example: 'SecurePassword123!',
  })
  @IsString()
  password: string;

  @ApiPropertyOptional({
    description: 'Full display name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john.doe@company.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '9876543210',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Department',
    example: 'Cardiology',
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({
    description: 'Designation / job title',
    example: 'Senior Doctor',
  })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiProperty({
    description: 'List of roles assigned to the user',
    example: ['admin', 'manager'],
    type: [String],
  })
  @IsArray()
  roles: string[];

  @ApiProperty({
    description: 'Tenant ID for the user',
    example: 'pharma_inc',
  })
  @IsString()
  tenantId: string;
}
