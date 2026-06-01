import type {
  SupplierOrderLineWriteInput,
  UpdateSupplierOrderRequest,
} from '@moduflow/types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  emptyStringToUndefined,
  trimString,
} from '../../../common/transforms/string.transforms';

class SupplierOrderLineWriteDto implements SupplierOrderLineWriteInput {
  @ApiPropertyOptional({ example: '91' })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  id?: string;

  @ApiPropertyOptional({ example: '71', nullable: true })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  supplierQuoteLineId?: string | null;

  @ApiPropertyOptional({ example: '15', nullable: true })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  houseModelId?: string | null;

  @ApiPropertyOptional({ example: '19', nullable: true })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  productConfigurationId?: string | null;

  @ApiPropertyOptional({ example: 'Two-bedroom modular shell' })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 500 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitCost!: number;
}

export class UpdateSupplierOrderDto implements UpdateSupplierOrderRequest {
  @ApiPropertyOptional({
    description:
      'Full replacement for order lines. Omit to keep existing lines untouched; send an empty array to clear all lines.',
    type: SupplierOrderLineWriteDto,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SupplierOrderLineWriteDto)
  orderLines?: SupplierOrderLineWriteDto[];
}
