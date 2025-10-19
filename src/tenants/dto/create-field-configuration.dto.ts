import { ApiProperty } from '@nestjs/swagger';

export class FieldConfigurationDto {
  @ApiProperty({
    description: 'Unique identifier for the field',
    example: 'vendor_category',
  })
  field_id: string;

  @ApiProperty({
    description: 'Display label for the field',
    example: 'Vendor Category',
  })
  label: string;

  @ApiProperty({
    description: 'Type of the field',
    example: 'enum',
    enum: ['string', 'enum', 'boolean', 'date'],
  })
  type: 'string' | 'enum' | 'boolean' | 'date';

  @ApiProperty({
    description: 'Possible values for enum type fields',
    example: ['Technology', 'Manufacturing', 'Services'],
    required: false,
    type: [String],
  })
  values?: string[];

  @ApiProperty({
    description: 'Whether the field is required',
    example: true,
  })
  required: boolean;
}

export class CreateFieldConfigurationDto {
  @ApiProperty({
    description: 'List of field configurations',
    type: [FieldConfigurationDto],
  })
  fields: FieldConfigurationDto[];
}
