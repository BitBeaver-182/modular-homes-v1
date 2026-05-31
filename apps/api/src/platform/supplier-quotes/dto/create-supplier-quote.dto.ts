import type {
  CreateSupplierQuoteRequest,
  SupplierQuoteWritableStatus,
} from '@moduflow/types';
import { SUPPLIER_QUOTE_WRITABLE_STATUSES } from '@moduflow/types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  emptyStringToUndefined,
  trimString,
  trimUppercaseString,
} from '../../../common/transforms/string.transforms';
import { SupplierQuoteLineDto } from './supplier-quote-line.dto';

export class CreateSupplierQuoteDto implements CreateSupplierQuoteRequest {
  @ApiProperty({ example: '1' })
  @Transform(trimString)
  @IsString()
  @MaxLength(40)
  supplierId!: string;

  @ApiPropertyOptional({ example: 'ckvxo0n1a000001l46me8xz6u', nullable: true })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(128)
  attachmentId?: string | null;

  @ApiPropertyOptional({ example: 'SQ-2026-001', nullable: true })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  quoteNumber?: string | null;

  @ApiPropertyOptional({
    enum: SUPPLIER_QUOTE_WRITABLE_STATUSES,
    default: 'received',
  })
  @IsOptional()
  @IsIn(SUPPLIER_QUOTE_WRITABLE_STATUSES)
  status?: SupplierQuoteWritableStatus;

  @ApiPropertyOptional({ example: '2026-05-30', nullable: true })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsDateString()
  quoteDate?: string | null;

  @ApiPropertyOptional({ example: '2026-06-30', nullable: true })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsDateString()
  validUntil?: string | null;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @Transform(trimUppercaseString)
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currencyCode?: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  subtotalAmount?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  shippingAmount?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxAmount?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalAmount?: number;

  @ApiPropertyOptional({ example: '50% deposit, net 30', nullable: true })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  paymentTerms?: string | null;

  @ApiPropertyOptional({ example: 'Supplier confirmed production slot.' })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;

  @ApiPropertyOptional({ type: SupplierQuoteLineDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SupplierQuoteLineDto)
  lines?: SupplierQuoteLineDto[];
}
