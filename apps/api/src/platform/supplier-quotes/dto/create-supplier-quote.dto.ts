import type {
  CreateSupplierQuoteRequest,
  SupplierQuoteStatus,
} from '@moduflow/types';
import {
  SUPPLIER_QUOTE_STATUSES,
} from '@moduflow/types';
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
import { SupplierQuoteLineDto } from './supplier-quote-line.dto';

const emptyToUndefined = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const trimUppercaseString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class CreateSupplierQuoteDto implements CreateSupplierQuoteRequest {
  @ApiProperty({ example: '1' })
  @Transform(trimString)
  @IsString()
  @MaxLength(40)
  supplierId!: string;

  @ApiPropertyOptional({ example: 'ckvxo0n1a000001l46me8xz6u', nullable: true })
  @Transform(emptyToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(128)
  attachmentId?: string | null;

  @ApiPropertyOptional({ example: 'SQ-2026-001', nullable: true })
  @Transform(emptyToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  quoteNumber?: string | null;

  @ApiPropertyOptional({ enum: SUPPLIER_QUOTE_STATUSES, default: 'received' })
  @IsOptional()
  @IsIn(SUPPLIER_QUOTE_STATUSES)
  status?: SupplierQuoteStatus;

  @ApiPropertyOptional({ example: '2026-05-30', nullable: true })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsDateString()
  quoteDate?: string | null;

  @ApiPropertyOptional({ example: '2026-06-30', nullable: true })
  @Transform(emptyToUndefined)
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

  @ApiPropertyOptional({ example: 'FOB', nullable: true })
  @Transform(emptyToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  incoterm?: string | null;

  @ApiPropertyOptional({ example: '50% deposit, net 30', nullable: true })
  @Transform(emptyToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  paymentTerms?: string | null;

  @ApiPropertyOptional({ example: 'Shanghai', nullable: true })
  @Transform(emptyToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  loadingPort?: string | null;

  @ApiPropertyOptional({ example: 'Rotterdam', nullable: true })
  @Transform(emptyToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  destinationPort?: string | null;

  @ApiPropertyOptional({ example: 'Supplier confirmed production slot.' })
  @Transform(emptyToUndefined)
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
