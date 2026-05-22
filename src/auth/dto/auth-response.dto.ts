import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
  })
  token_type: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
  })
  expires_in: number;

  @ApiProperty({
    description: 'User roles',
    example: ['admin', 'manager'],
    type: [String],
  })
  roles: string[];

  @ApiProperty({
    description: 'User scopes',
    example: ['users:read', 'users:write'],
    type: [String],
  })
  scopes: string[];

  @ApiProperty({
    description: 'Tenant ID',
    example: 'pharma_inc',
  })
  tenantId: string;
}
