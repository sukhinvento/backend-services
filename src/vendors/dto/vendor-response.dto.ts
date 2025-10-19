import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VendorResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the vendor',
    example: '507f1f77bcf86cd799439011',
  })
  _id: string;

  @ApiProperty({
    description: 'Unique vendor code',
    example: 'VND-001',
  })
  vendor_code: string;

  @ApiProperty({
    description: 'Vendor name',
    example: 'Tech Solutions Ltd',
  })
  name: string;

  @ApiProperty({
    description: 'Legal name of the vendor',
    example: 'Tech Solutions Limited',
  })
  legal_name: string;

  @ApiProperty({
    description: 'Tax identification number',
    example: 'TAX123456789',
  })
  tax_id: string;

  @ApiProperty({
    description: 'Vendor address',
    example: '123 Business St, Tech City, TC 12345',
  })
  address: string;

  @ApiProperty({
    description: 'List of contact persons',
    example: ['John Doe', 'Jane Smith'],
    type: [String],
  })
  contact_persons: string[];

  @ApiProperty({
    description: 'Default lead time in days',
    example: 14,
  })
  default_lead_time_days: number;

  @ApiProperty({
    description: 'Payment terms',
    example: 'Net 30 days',
  })
  payment_terms: string;

  @ApiPropertyOptional({
    description: 'Supported tax slabs (legacy field)',
    example: ['GST-18%', 'GST-12%'],
    type: [String],
  })
  supported_tax_slabs?: string[];

  @ApiPropertyOptional({
    description: 'Tax IDs applicable to this vendor',
    example: ['507f1f77bcf86cd799439011', '507f191e810c19729de860ea'],
    type: [String],
  })
  applicable_tax_ids?: string[];

  @ApiPropertyOptional({
    description: 'Default tax ID for purchase transactions',
    example: '507f1f77bcf86cd799439011',
  })
  default_purchase_tax_id?: string;

  @ApiPropertyOptional({
    description: 'Custom fields for additional vendor information',
    example: { industry: 'Technology', rating: 'A+' },
  })
  custom_fields?: Record<string, any>;

  @ApiProperty({
    description: 'When the vendor was created',
    example: '2025-09-19T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the vendor was last updated',
    example: '2025-09-19T10:00:00.000Z',
  })
  updatedAt: Date;
}
