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
    description: 'User information',
    example: {
      userId: '507f1f77bcf86cd799439011',
      username: 'john.doe@company.com',
      roles: ['admin', 'manager'],
    },
  })
  user: {
    userId: string;
    username: string;
    roles: string[];
  };
}
