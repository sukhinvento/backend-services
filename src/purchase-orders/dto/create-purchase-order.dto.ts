import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, Min, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsOptional()
  @IsString()
  item_id?: string;

  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  qty: number;

  @IsNumber()
  @Min(0)
  unit_price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsOptional()
  @IsNumber()
  tax_slab?: number;

  @IsOptional()
  @IsString()
  sale_unit?: string;
}

export class CreatePurchaseOrderDto {
  @ApiPropertyOptional({ example: 'PO-2024-001' })
  @IsOptional()
  @IsString()
  po_number?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsString()
  vendor_id?: string;

  @ApiPropertyOptional({ example: 'PharmaCorp India Pvt Ltd' })
  @IsOptional()
  @IsString()
  vendor_name?: string;

  @ApiPropertyOptional({ example: '+91-9876543210' })
  @IsOptional()
  @IsString()
  vendor_phone?: string;

  @ApiPropertyOptional({ example: 'vendor@example.com' })
  @IsOptional()
  @IsString()
  vendor_email?: string;

  @ApiPropertyOptional({ example: '123 Vendor Street, Mumbai' })
  @IsOptional()
  @IsString()
  vendor_address?: string;

  @ApiPropertyOptional({ example: '29AAACR5055K1Z5', description: 'Vendor GSTIN for GST invoice' })
  @IsOptional()
  @IsString()
  vendor_gstin?: string;

  @ApiPropertyOptional({ example: '29', description: 'Vendor state code (2-digit) for IGST vs CGST+SGST determination' })
  @IsOptional()
  @IsString()
  vendor_state_code?: string;

  @ApiPropertyOptional({ example: 'Ward B, Floor 2' })
  @IsOptional()
  @IsString()
  shipping_address?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsString()
  order_date?: string;

  @ApiPropertyOptional({ example: '2024-01-30' })
  @IsOptional()
  @IsString()
  delivery_date?: string;

  @ApiPropertyOptional({ example: '2024-02-01' })
  @IsOptional()
  @IsString()
  fulfilment_date?: string;

  @ApiPropertyOptional({
    type: [Object],
    example: [{ item_id: '507f1f77bcf86cd799439011', name: 'Paracetamol 500mg', qty: 10, unit_price: 5, discount: 0, subtotal: 50, tax_slab: 5, sale_unit: 'Strip' }],
  })
  @IsOptional()
  @IsArray()
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];

  @ApiPropertyOptional({ example: 550 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  grand_total?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paid_amount?: number;

  @ApiPropertyOptional({ example: 'net-30' })
  @IsOptional()
  @IsString()
  payment_method?: string;

  @ApiPropertyOptional({ example: 'draft', enum: ['draft', 'pending', 'approved', 'fulfilled', 'cancelled'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'Urgent order for ICU supplies' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Dr. Sharma' })
  @IsOptional()
  @IsString()
  approved_by?: string;

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  remarks?: Record<string, any>[];

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  custom_fields?: Record<string, any>;
}
