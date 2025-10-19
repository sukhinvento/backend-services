import { ApiProperty } from '@nestjs/swagger';

export class CreateStockTransferDto {
  @ApiProperty({
    description: 'Unique transfer number',
    example: 'TRF-2024-001',
  })
  transfer_number: string;

  @ApiProperty({
    description: 'Source location ID',
    example: '507f1f77bcf86cd799439011',
  })
  from_location_id: string;

  @ApiProperty({
    description: 'Destination location ID',
    example: '507f1f77bcf86cd799439012',
  })
  to_location_id: string;

  @ApiProperty({
    description: 'List of items to transfer',
    example: [
      {
        item_id: 'ITEM-001',
        quantity: 10,
        unit_cost: 100.00,
      },
    ],
    type: [Object],
  })
  items: Record<string, any>[];

  @ApiProperty({
    description: 'Transfer status',
    example: 'draft',
    enum: ['draft', 'pending', 'in_transit', 'completed', 'cancelled'],
  })
  status: 'draft' | 'pending' | 'in_transit' | 'completed' | 'cancelled';

  @ApiProperty({
    description: 'Custom fields for additional transfer information',
    example: { 
      reason: 'Inventory rebalancing',
      priority: 'high',
      expected_date: '2024-12-31T23:59:59.000Z'
    },
    required: false,
  })
  custom_fields?: Record<string, any>;
}
