import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaxResponseDto {
  @ApiProperty({
    description: 'Tax ID',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'Unique tax code',
    example: 'TAX-GST-18',
  })
  tax_code: string;

  @ApiProperty({
    description: 'Tax name',
    example: 'GST 18%',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Tax description',
    example: 'Goods and Services Tax at 18% rate',
  })
  description?: string;

  @ApiProperty({
    description: 'Tax rate',
    example: 18,
  })
  rate: number;

  @ApiProperty({
    description: 'Type of tax rate',
    enum: ['percentage', 'fixed'],
    example: 'percentage',
  })
  rate_type: 'percentage' | 'fixed';

  @ApiProperty({
    description: 'Where this tax is applicable',
    enum: ['sales', 'purchase', 'both'],
    example: 'both',
  })
  applicable_on: 'sales' | 'purchase' | 'both';

  @ApiProperty({
    description: 'Tax status',
    enum: ['active', 'inactive', 'archived'],
    example: 'active',
  })
  status: 'active' | 'inactive' | 'archived';

  @ApiPropertyOptional({
    description: 'Tax jurisdiction',
    example: 'Federal',
  })
  jurisdiction?: string;

  @ApiPropertyOptional({
    description: 'Tax category',
    example: 'GST',
  })
  tax_category?: string;

  @ApiPropertyOptional({
    description: 'Effective start date',
    example: '2024-01-01T00:00:00.000Z',
  })
  effective_from?: Date;

  @ApiPropertyOptional({
    description: 'Effective end date',
    example: '2025-12-31T23:59:59.999Z',
  })
  effective_to?: Date;

  @ApiPropertyOptional({
    description: 'Tax components for compound taxes',
    type: Array,
  })
  components?: Array<{
    name: string;
    rate: number;
    description?: string;
  }>;

  @ApiProperty({
    description: 'Priority for tax calculation',
    example: 1,
  })
  priority: number;

  @ApiProperty({
    description: 'Whether tax is included in price',
    example: false,
  })
  is_inclusive: boolean;

  @ApiProperty({
    description: 'Whether tax is compounded',
    example: false,
  })
  is_compound: boolean;

  @ApiPropertyOptional({
    description: 'Tax configuration settings',
  })
  configuration?: {
    min_amount?: number;
    max_amount?: number;
    exempt_threshold?: number;
    reverse_charge?: boolean;
  };

  @ApiPropertyOptional({
    description: 'Custom fields',
  })
  custom_fields?: Record<string, any>;

  @ApiProperty({
    description: 'User ID who created the tax',
    example: '507f1f77bcf86cd799439011',
  })
  createdBy: string;

  @ApiProperty({
    description: 'User ID who last updated the tax',
    example: '507f1f77bcf86cd799439011',
  })
  updatedBy: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
}

