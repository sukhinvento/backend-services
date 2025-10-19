import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Username for the new user',
    example: 'john.doe@company.com',
  })
  username: string;

  @ApiProperty({
    description: 'Plain text password for the user',
    example: 'SecurePassword123!',
  })
  password: string;

  @ApiProperty({
    description: 'List of roles assigned to the user',
    example: ['admin', 'manager'],
    type: [String],
  })
  roles: string[];
}
