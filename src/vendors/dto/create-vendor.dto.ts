import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, Min } from 'class-validator';

export class CreateVendorDto {
  @ApiProperty({
    description: 'Unique vendor code',
    example: 'VND-001',
  })
  @IsString()
  vendor_code: string;

  @ApiProperty({
    description: 'Vendor name',
    example: 'Tech Solutions Ltd',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Legal name of the vendor',
    example: 'Tech Solutions Limited',
  })
  @IsOptional()
  @IsString()
  legal_name?: string;

  @ApiProperty({
    description: 'Tax identification number',
    example: 'TAX123456789',
  })
  @IsString()
  tax_id: string;

  @ApiPropertyOptional({
    description: 'Vendor address',
    example: '123 Business St, Tech City, TC 12345',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'List of contact persons',
    example: ['John Doe', 'Jane Smith'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contact_persons?: string[];

  @ApiPropertyOptional({
    description: 'Default lead time in days',
    example: 14,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  default_lead_time_days?: number;

  @ApiPropertyOptional({
    description: 'Payment terms',
    example: 'Net 30 days',
  })
  @IsOptional()
  @IsString()
  payment_terms?: string;

  @ApiPropertyOptional({
    description: 'Supported tax slabs (legacy field)',
    example: ['GST-18%', 'GST-12%'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supported_tax_slabs?: string[];

  @ApiPropertyOptional({
    description: 'Tax IDs applicable to this vendor (reference to Tax module)',
    example: ['507f1f77bcf86cd799439011', '507f191e810c19729de860ea'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicable_tax_ids?: string[];

  @ApiPropertyOptional({
    description: 'Default tax ID for purchase transactions with this vendor',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsString()
  default_purchase_tax_id?: string;

  @ApiPropertyOptional({
    description: 'Custom fields for additional vendor information',
    example: { industry: 'Technology', rating: 'A+' },
  })
  @IsOptional()
  custom_fields?: Record<string, any>;
}
