import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Name of the role',
    example: 'manager',
  })
  name: string;

  @ApiProperty({
    description: 'List of scopes/permissions for this role',
    example: ['tenants:read', 'vendors:create', 'vendors:read'],
    type: [String],
  })
  scopes: string[];
}
