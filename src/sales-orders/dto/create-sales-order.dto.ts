import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, Min, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class SalesOrderItemDto {
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

export class CreateSalesOrderDto {
  @ApiPropertyOptional({ example: 'SO-2024-001' })
  @IsOptional()
  @IsString()
  so_number?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsString()
  customer_id?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  customer_name?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsString()
  customer_email?: string;

  @ApiPropertyOptional({ example: '+91-9876543210' })
  @IsOptional()
  @IsString()
  customer_phone?: string;

  @ApiPropertyOptional({ example: '456 Customer Lane, Delhi' })
  @IsOptional()
  @IsString()
  customer_address?: string;

  @ApiPropertyOptional({ example: 'Ward A, Bed 12' })
  @IsOptional()
  @IsString()
  shipping_address?: string;

  @ApiPropertyOptional({ example: '456 Customer Lane, Delhi' })
  @IsOptional()
  @IsString()
  billing_address?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsString()
  order_date?: string;

  @ApiPropertyOptional({ example: '2024-01-25' })
  @IsOptional()
  @IsString()
  due_date?: string;

  @ApiPropertyOptional({ example: '2024-01-20' })
  @IsOptional()
  @IsString()
  delivery_date?: string;

  @ApiPropertyOptional({
    type: [Object],
    example: [{ item_id: '507f1f77bcf86cd799439011', name: 'Amoxicillin 250mg', qty: 2, unit_price: 80, discount: 5, subtotal: 152, tax_slab: 12, sale_unit: 'Box' }],
  })
  @IsOptional()
  @IsArray()
  @Type(() => SalesOrderItemDto)
  items?: SalesOrderItemDto[];

  @ApiPropertyOptional({ example: 1200 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  grand_total?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paid_amount?: number;

  @ApiPropertyOptional({ example: 'Credit Card' })
  @IsOptional()
  @IsString()
  payment_method?: string;

  @ApiPropertyOptional({ example: 'Pending', enum: ['Pending', 'Paid', 'Partial', 'Overdue'] })
  @IsOptional()
  @IsString()
  payment_status?: string;

  @ApiPropertyOptional({ example: 'draft', enum: ['draft', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'Patient needs medication urgently' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  custom_fields?: Record<string, any>;
}
