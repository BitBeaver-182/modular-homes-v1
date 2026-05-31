import type { SupplierQuoteLineRequest } from '@moduflow/types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  emptyStringToUndefined,
  trimString,
} from '../../../common/transforms/string.transforms';

export class SupplierQuoteLineDto implements SupplierQuoteLineRequest {
  @ApiPropertyOptional({ example: '1' })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  id?: string;

  @ApiPropertyOptional({ example: '12', nullable: true })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  houseModelId?: string | null;

  @ApiPropertyOptional({ example: '25', nullable: true })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  productConfigurationId?: string | null;

  @ApiPropertyOptional({ example: 'Two-bedroom modular home shell' })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitCost!: number;

  @ApiPropertyOptional({ example: 45, nullable: true })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedProductionDays?: number | null;

  @ApiPropertyOptional({ example: 'Includes standard fixture package' })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}
