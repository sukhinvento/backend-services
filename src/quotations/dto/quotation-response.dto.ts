import { ApiProperty } from '@nestjs/swagger';

export class QuotationResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the quotation',
    example: '507f1f77bcf86cd799439011',
  })
  _id: string;

  @ApiProperty({
    description: 'Unique quotation number',
    example: 'QUO-2024-001',
  })
  quotation_number: string;

  @ApiProperty({
    description: 'Vendor ID',
    example: '507f1f77bcf86cd799439011',
  })
  vendor_id: string;

  @ApiProperty({
    description: 'Customer ID',
    example: '507f1f77bcf86cd799439012',
  })
  customer_id: string;

  @ApiProperty({
    description: 'List of items in the quotation',
    example: [
      {
        item_id: 'ITEM-001',
        description: 'Product Name',
        quantity: 10,
        unit_price: 100.00,
        total_price: 1000.00,
      },
    ],
    type: [Object],
  })
  items: Record<string, any>[];

  @ApiProperty({
    description: 'Quotation status',
    example: 'draft',
    enum: ['draft', 'sent', 'approved', 'rejected', 'expired'],
  })
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';

  @ApiProperty({
    description: 'Quotation validity date',
    example: '2024-12-31T23:59:59.000Z',
  })
  valid_until: Date;

  @ApiProperty({
    description: 'Additional remarks',
    example: 'Please review and approve',
  })
  remarks?: string;

  @ApiProperty({
    description: 'Custom fields for additional quotation information',
    example: { priority: 'high', department: 'procurement' },
  })
  custom_fields: Record<string, any>;

  @ApiProperty({
    description: 'Pricing information',
    example: {
      subtotal: 1000.00,
      tax_amount: 180.00,
      total_amount: 1180.00,
      currency: 'USD',
    },
  })
  pricing: {
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    currency: string;
  };

  @ApiProperty({
    description: 'Terms and conditions',
    example: {
      payment_terms: 'Net 30 days',
      delivery_terms: 'FOB Destination',
      validity_days: 30,
    },
  })
  terms: {
    payment_terms: string;
    delivery_terms: string;
    validity_days: number;
  };

  @ApiProperty({
    description: 'When the quotation was created',
    example: '2024-09-19T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the quotation was last updated',
    example: '2024-09-19T10:00:00.000Z',
  })
  updatedAt: Date;
}
