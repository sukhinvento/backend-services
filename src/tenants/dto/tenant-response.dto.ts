import { ApiProperty } from '@nestjs/swagger';

export class TenantResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the tenant',
    example: '507f1f77bcf86cd799439011',
  })
  _id: string;

  @ApiProperty({
    description: 'Name of the tenant',
    example: 'Acme Corporation',
  })
  name: string;

  @ApiProperty({
    description: 'When the tenant was created',
    example: '2025-09-19T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the tenant was last updated',
    example: '2025-09-19T10:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'User who created this tenant',
    example: '507f1f77bcf86cd799439012',
  })
  createdBy: string;

  @ApiProperty({
    description: 'User who last updated this tenant',
    example: '507f1f77bcf86cd799439012',
  })
  updatedBy: string;
}
