import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({
    description: 'Name of the tenant',
    example: 'Acme Corporation',
    minLength: 1,
    maxLength: 100,
  })
  name: string;
}
