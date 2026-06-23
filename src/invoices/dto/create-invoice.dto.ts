import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsArray, IsBoolean } from 'class-validator';

export class InvoiceItemDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: 'HSN code for goods / SAC code for services' })
  @IsOptional() @IsString()
  hsn_code?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber()
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber()
  unit_price?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber()
  discount_percent?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber()
  tax_slab?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber()
  tax_amount?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber()
  subtotal?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber()
  total?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  sale_unit?: string;
}

export class TaxBreakdownDto {
  @ApiPropertyOptional()
  @IsOptional() @IsNumber()
  rate?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber()
  taxable_amount?: number;

  @ApiPropertyOptional({ description: 'Central GST — intra-state only' })
  @IsOptional() @IsNumber()
  cgst?: number;

  @ApiPropertyOptional({ description: 'State GST — intra-state only' })
  @IsOptional() @IsNumber()
  sgst?: number;

  @ApiPropertyOptional({ description: 'Integrated GST — inter-state only' })
  @IsOptional() @IsNumber()
  igst?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber()
  total_tax?: number;
}

export class CreateInvoiceDto {
  @IsOptional() @IsString()
  invoice_number?: string;

  @IsOptional() @IsString()
  order_id?: string;

  @IsOptional() @IsArray()
  items?: InvoiceItemDto[];

  @IsOptional() @IsNumber()
  subtotal?: number;

  @IsOptional() @IsNumber()
  total_tax?: number;

  @IsOptional() @IsNumber()
  total_discount?: number;

  @IsOptional() @IsNumber()
  amount?: number;

  @IsOptional() @IsString()
  status?: string;

  // ── Vendor details (PO invoices) ─────────────────────────────────────────
  @IsOptional() @IsString()
  vendor_name?: string;

  @IsOptional() @IsString()
  vendor_id?: string;

  @IsOptional() @IsString()
  vendor_phone?: string;

  @IsOptional() @IsString()
  vendor_email?: string;

  @IsOptional() @IsString()
  vendor_address?: string;

  // ── Customer details (SO / diagnostic / admission invoices) ───────────────
  @IsOptional() @IsString()
  customer_name?: string;

  @IsOptional() @IsString()
  customer_id?: string;

  @IsOptional() @IsString()
  customer_phone?: string;

  @IsOptional() @IsString()
  customer_email?: string;

  @IsOptional() @IsString()
  customer_address?: string;

  // ── Source reference ─────────────────────────────────────────────────────
  @IsOptional() @IsString()
  source_type?: string;

  @IsOptional() @IsString()
  source_number?: string;

  // ── Order metadata ───────────────────────────────────────────────────────
  @IsOptional() @IsString()
  order_date?: string;

  @IsOptional() @IsString()
  delivery_date?: string;

  @IsOptional() @IsString()
  due_date?: string;

  @IsOptional() @IsString()
  payment_method?: string;

  @IsOptional() @IsString()
  shipping_address?: string;

  @IsOptional() @IsString()
  notes?: string;

  // ── GST fields ───────────────────────────────────────────────────────────
  @IsOptional() @IsString()
  seller_gstin?: string;

  @IsOptional() @IsString()
  buyer_gstin?: string;

  @IsOptional() @IsString()
  place_of_supply?: string;

  @IsOptional() @IsBoolean()
  is_inter_state?: boolean;

  @IsOptional() @IsString()
  invoice_type?: string;   // 'tax_invoice' | 'bill_of_supply'

  // ── GST breakdown ─────────────────────────────────────────────────────────
  @IsOptional() @IsArray()
  tax_breakdown?: TaxBreakdownDto[];

  @IsOptional()
  custom_fields?: Record<string, any>;
}
