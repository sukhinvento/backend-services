import { ApiProperty } from '@nestjs/swagger';

export class CreateStockAdjustmentDto {
  @ApiProperty({
    description: 'Unique adjustment number',
    example: 'ADJ-2024-001',
  })
  adjustment_number: string;

  @ApiProperty({
    description: 'Location ID for adjustment',
    example: '507f1f77bcf86cd799439011',
  })
  location_id: string;

  @ApiProperty({
    description: 'List of items to adjust',
    example: [
      {
        item_id: 'ITEM-001',
        quantity_delta: 5,
        reason: 'Found during cycle count',
      },
    ],
    type: [Object],
  })
  items: Record<string, any>[];

  @ApiProperty({
    description: 'Adjustment status',
    example: 'draft',
    enum: ['draft', 'pending', 'applied', 'cancelled'],
  })
  status: 'draft' | 'pending' | 'applied' | 'cancelled';

  @ApiProperty({
    description: 'Custom fields for additional adjustment information',
    example: { 
      reason: 'Cycle count discrepancy',
      approved_by: 'John Doe',
      adjustment_date: '2024-12-31T23:59:59.000Z'
    },
    required: false,
  })
  custom_fields?: Record<string, any>;
}
