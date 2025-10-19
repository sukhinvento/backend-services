import { ApiProperty } from '@nestjs/swagger';

export class FulfillmentResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the fulfillment',
    example: '507f1f77bcf86cd799439011',
  })
  _id: string;

  @ApiProperty({
    description: 'Unique fulfillment number',
    example: 'FUL-2024-001',
  })
  fulfillment_number: string;

  @ApiProperty({
    description: 'Purchase Order ID',
    example: '507f1f77bcf86cd799439011',
  })
  po_id: string;

  @ApiProperty({
    description: 'List of fulfilled items',
    example: [
      {
        item_id: 'ITEM-001',
        quantity: 10,
        unit_price: 100.00,
        total_price: 1000.00,
      },
    ],
    type: [Object],
  })
  items: Record<string, any>[];

  @ApiProperty({
    description: 'Fulfillment status',
    example: 'draft',
    enum: ['draft', 'partial', 'complete', 'discrepancy'],
  })
  status: 'draft' | 'partial' | 'complete' | 'discrepancy';

  @ApiProperty({
    description: 'Custom fields for additional fulfillment information',
    example: { 
      delivery_date: '2024-12-31T23:59:59.000Z',
      received_by: 'John Doe',
      invoice_number: 'INV-001',
      carrier: 'FedEx',
      tracking_number: 'FX123456789'
    },
  })
  custom_fields: Record<string, any>;

  @ApiProperty({
    description: 'When the fulfillment was created',
    example: '2024-09-19T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the fulfillment was last updated',
    example: '2024-09-19T10:00:00.000Z',
  })
  updatedAt: Date;
}
