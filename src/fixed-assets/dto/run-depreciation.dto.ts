import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class RunDepreciationDto {
  @ApiProperty({
    description: 'Period for depreciation run (YYYY-MM)',
    example: '2026-06',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'period must be in YYYY-MM format' })
  period: string;
}
