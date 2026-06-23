import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JournalLineDto } from './journal-line.dto';

export class CreateJournalEntryDto {
  @ApiProperty({ description: 'Entry date', example: '2026-06-05' })
  @IsDateString()
  entry_date: string;

  @ApiProperty({ description: 'Description / memo', example: 'Payment received for INV-001' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Reference type: manual | invoice_po | invoice_so | payment_received | payment_made | depreciation | adjustment',
    example: 'manual',
  })
  @IsString()
  @IsNotEmpty()
  reference_type: string;

  @ApiPropertyOptional({ description: 'Source document ID (e.g. invoice ObjectId)' })
  @IsOptional()
  @IsString()
  reference_id?: string;

  @ApiPropertyOptional({ description: 'Human-readable reference number', example: 'INV-2026-0042' })
  @IsOptional()
  @IsString()
  reference_number?: string;

  @ApiProperty({ description: 'Journal lines (at least 2 — one debit, one credit)', type: [JournalLineDto] })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];
}
