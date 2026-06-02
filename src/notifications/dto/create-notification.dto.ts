import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({ description: 'Target user ID' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Notification title', example: 'New Purchase Order' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification message', example: 'PO-0042 has been created' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ enum: ['info', 'success', 'warning', 'error'], default: 'info' })
  @IsOptional()
  @IsEnum(['info', 'success', 'warning', 'error'])
  type?: string;

  @ApiPropertyOptional({
    enum: [
      'system', 'inventory', 'purchase_order', 'sales_order',
      'patient', 'admission', 'diagnostic', 'billing', 'invoice', 'vendor', 'doctor',
    ],
    default: 'system',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Related entity ID' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Related entity type' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: 'URL to navigate when clicked' })
  @IsOptional()
  @IsString()
  actionUrl?: string;
}
