import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsString, IsObject } from 'class-validator';

export class QueryDto {
  @ApiProperty({
    required: false,
    description: 'Page number for pagination',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({
    required: false,
    description: 'Number of items per page',
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiProperty({
    required: false,
    description: 'Sort order, e.g., "name_asc" or "createdAt_desc"',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiProperty({
    required: false,
    description: 'Filter criteria as a JSON object',
  })
  @IsOptional()
  @IsObject()
  filter?: Record<string, any>;
}
