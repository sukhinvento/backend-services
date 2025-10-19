import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsArray, IsBoolean, IsDateString, Min, Max, IsObject, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTaxDto {
  @ApiProperty({
    description: 'Unique tax code',
    example: 'TAX-GST-18',
  })
  @IsString()
  tax_code: string;

  @ApiProperty({
    description: 'Tax name',
    example: 'GST 18%',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Tax description',
    example: 'Goods and Services Tax at 18% rate',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Tax rate (percentage or fixed amount)',
    example: 18,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  rate: number;

  @ApiProperty({
    description: 'Type of tax rate',
    enum: ['percentage', 'fixed'],
    example: 'percentage',
  })
  @IsEnum(['percentage', 'fixed'])
  rate_type: 'percentage' | 'fixed';

  @ApiPropertyOptional({
    description: 'Where this tax is applicable',
    enum: ['sales', 'purchase', 'both'],
    example: 'both',
    default: 'both',
  })
  @IsOptional()
  @IsEnum(['sales', 'purchase', 'both'])
  applicable_on?: 'sales' | 'purchase' | 'both';

  @ApiPropertyOptional({
    description: 'Tax status',
    enum: ['active', 'inactive', 'archived'],
    example: 'active',
    default: 'active',
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'archived'])
  status?: 'active' | 'inactive' | 'archived';

  @ApiPropertyOptional({
    description: 'Tax jurisdiction',
    example: 'Federal',
  })
  @IsOptional()
  @IsString()
  jurisdiction?: string;

  @ApiPropertyOptional({
    description: 'Tax category',
    example: 'GST',
  })
  @IsOptional()
  @IsString()
  tax_category?: string;

  @ApiPropertyOptional({
    description: 'Effective start date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @ValidateIf((o) => o.effective_from !== undefined && o.effective_from !== null && o.effective_from !== '')
  @IsDateString()
  effective_from?: Date;

  @ApiPropertyOptional({
    description: 'Effective end date',
    example: '2025-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @ValidateIf((o) => o.effective_to !== undefined && o.effective_to !== null && o.effective_to !== '')
  @IsDateString()
  effective_to?: Date;

  @ApiPropertyOptional({
    description: 'Tax components for compound taxes',
    example: [
      { name: 'CGST', rate: 9, description: 'Central GST' },
      { name: 'SGST', rate: 9, description: 'State GST' },
    ],
    type: Array,
  })
  @IsOptional()
  @IsArray()
  components?: Array<{
    name: string;
    rate: number;
    description?: string;
  }>;

  @ApiPropertyOptional({
    description: 'Priority for tax calculation (lower = higher priority)',
    example: 1,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional({
    description: 'Whether tax is included in price',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_inclusive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether tax is compounded (calculated on subtotal + other taxes)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_compound?: boolean;

  @ApiPropertyOptional({
    description: 'Tax configuration settings',
    example: {
      min_amount: 0,
      max_amount: 1000000,
      exempt_threshold: 100,
      reverse_charge: false,
    },
  })
  @IsOptional()
  @IsObject()
  configuration?: {
    min_amount?: number;
    max_amount?: number;
    exempt_threshold?: number;
    reverse_charge?: boolean;
  };

  @ApiPropertyOptional({
    description: 'Custom fields for additional tax information',
    example: { reporting_code: 'GST-001', account_code: '4000' },
  })
  @IsOptional()
  @IsObject()
  custom_fields?: Record<string, any>;
}

