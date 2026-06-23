import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { AccountType } from '../schemas/account.schema';

export class CreateAccountDto {
  @ApiProperty({ description: 'Account code (e.g. "1001", "4003")', example: '1001' })
  @IsString()
  @IsNotEmpty()
  account_code: string;

  @ApiProperty({ description: 'Account name', example: 'Cash and Bank' })
  @IsString()
  @IsNotEmpty()
  account_name: string;

  @ApiProperty({ description: 'Account type', enum: AccountType, example: AccountType.ASSET })
  @IsEnum(AccountType)
  account_type: AccountType;

  @ApiPropertyOptional({
    description: 'Account sub-type (e.g. current_asset, fixed_asset, operating_expense)',
    example: 'current_asset',
  })
  @IsOptional()
  @IsString()
  account_sub_type?: string;

  @ApiPropertyOptional({ description: 'Account description', example: 'Cash on hand and bank balances' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Parent account ID for hierarchical CoA' })
  @IsOptional()
  @IsString()
  parent_account_id?: string;

  @ApiPropertyOptional({ description: 'Whether the account is active', default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
