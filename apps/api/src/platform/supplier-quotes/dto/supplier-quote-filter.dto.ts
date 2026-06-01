import type { SupplierQuoteStatus } from '@moduflow/types';
import { SUPPLIER_QUOTE_STATUSES } from '@moduflow/types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import {
  emptyStringToUndefined,
  trimString,
  trimUppercaseString,
} from '../../../common/transforms/string.transforms';

export const SUPPLIER_QUOTE_SORT_FIELDS = [
  'createdAt',
  'quoteDate',
  'validUntil',
  'totalAmount',
  'status',
  'supplier.name',
  'quoteNumber',
] as const;

export const SUPPLIER_QUOTE_SORT_CRITERIA = ['asc', 'desc'] as const;

type SupplierQuoteSortField = (typeof SUPPLIER_QUOTE_SORT_FIELDS)[number];
type SupplierQuoteSortCriteria = (typeof SUPPLIER_QUOTE_SORT_CRITERIA)[number];

const toStringArray = ({ value }: { value: unknown }): string[] | undefined => {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return [value];
  }
  return undefined;
};

const toOptionalBoolean = ({
  value,
}: {
  value: unknown;
}): boolean | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
  }
  return value as boolean;
};

export class SupplierQuoteFilterDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10, maximum: 100 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'SQ-2026' })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    name: 'status',
    enum: SUPPLIER_QUOTE_STATUSES,
    isArray: true,
  })
  @Transform(toStringArray)
  @IsOptional()
  @IsArray()
  @IsIn(SUPPLIER_QUOTE_STATUSES, { each: true })
  status?: SupplierQuoteStatus[];

  @ApiPropertyOptional({ example: true })
  @Transform(toOptionalBoolean)
  @IsOptional()
  @IsBoolean()
  isExpired?: boolean;

  @ApiPropertyOptional({ name: 'supplierIds', type: String, isArray: true })
  @Transform(toStringArray)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supplierIds?: string[];

  @ApiPropertyOptional({ example: '2026-05-01' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsDateString()
  quoteDateFrom?: string;

  @ApiPropertyOptional({ example: '2026-05-31' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsDateString()
  quoteDateTo?: string;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsDateString()
  validUntilFrom?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsDateString()
  validUntilTo?: string;

  @ApiPropertyOptional({ example: 1000 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalAmountMin?: number;

  @ApiPropertyOptional({ example: 5000 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalAmountMax?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @Transform(emptyStringToUndefined)
  @Transform(trimUppercaseString)
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currencyCode?: string;

  @ApiPropertyOptional({
    name: 'sortField',
    enum: SUPPLIER_QUOTE_SORT_FIELDS,
  })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsIn(SUPPLIER_QUOTE_SORT_FIELDS)
  sortField?: SupplierQuoteSortField;

  @ApiPropertyOptional({
    name: 'sortCriteria',
    enum: SUPPLIER_QUOTE_SORT_CRITERIA,
  })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsIn(SUPPLIER_QUOTE_SORT_CRITERIA)
  sortCriteria?: SupplierQuoteSortCriteria;
}
