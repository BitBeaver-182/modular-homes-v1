import type { SupplierOrderListStatus } from '@moduflow/types';
import { SUPPLIER_ORDER_LIST_STATUSES } from '@moduflow/types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  emptyStringToUndefined,
  trimString,
} from '../../../common/transforms/string.transforms';

export const SUPPLIER_ORDER_SORT_FIELDS = [
  'id',
  'createdAt',
  'status',
  'supplier.name',
] as const;

export const SUPPLIER_ORDER_SORT_CRITERIA = ['asc', 'desc'] as const;

type SupplierOrderSortField = (typeof SUPPLIER_ORDER_SORT_FIELDS)[number];
type SupplierOrderSortCriteria = (typeof SUPPLIER_ORDER_SORT_CRITERIA)[number];

const toStringArray = ({ value }: { value: unknown }): string[] | undefined => {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return [value];
  }
  return undefined;
};

export class SupplierOrderFilterDto {
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

  @ApiPropertyOptional({ example: 'SO-2026-001' })
  @Transform(emptyStringToUndefined)
  @Transform(trimString)
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    name: 'status',
    enum: SUPPLIER_ORDER_LIST_STATUSES,
    isArray: true,
  })
  @Transform(toStringArray)
  @IsOptional()
  @IsArray()
  @IsIn(SUPPLIER_ORDER_LIST_STATUSES, { each: true })
  status?: SupplierOrderListStatus[];

  @ApiPropertyOptional({ name: 'supplierIds', type: String, isArray: true })
  @Transform(toStringArray)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supplierIds?: string[];

  @ApiPropertyOptional({ example: '2026-06-01' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({
    name: 'sortField',
    enum: SUPPLIER_ORDER_SORT_FIELDS,
  })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsIn(SUPPLIER_ORDER_SORT_FIELDS)
  sortField?: SupplierOrderSortField;

  @ApiPropertyOptional({
    name: 'sortCriteria',
    enum: SUPPLIER_ORDER_SORT_CRITERIA,
  })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsIn(SUPPLIER_ORDER_SORT_CRITERIA)
  sortCriteria?: SupplierOrderSortCriteria;
}
