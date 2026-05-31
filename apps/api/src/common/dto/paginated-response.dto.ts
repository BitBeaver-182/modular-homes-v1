import type {
  PaginatedListMetaResponse as PaginatedListMetaContract,
  PaginationMeta as PaginationMetaContract,
} from '@moduflow/types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class PaginationMetaResponseDto implements PaginationMetaContract {
  constructor(partial: PaginationMetaContract) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: 1 })
  @Expose()
  page!: number;

  @ApiProperty({ example: 15 })
  @Expose()
  pageSize!: number;

  @ApiProperty({ example: 3 })
  @Expose()
  pageCount!: number;

  @ApiProperty({ example: 42 })
  @Expose()
  total!: number;
}

export class PaginatedListMetaResponseDto implements PaginatedListMetaContract {
  constructor(partial: PaginatedListMetaContract) {
    Object.assign(this, partial);
  }

  @Expose()
  @Type(() => PaginationMetaResponseDto)
  @ApiProperty({ type: PaginationMetaResponseDto })
  pagination!: PaginationMetaResponseDto;
}

type ResponseDtoClass<T> = new (...args: never[]) => T;

export function createPaginatedResponseDto<TData>(
  dataDto: ResponseDtoClass<TData>,
) {
  class PaginatedResponseDto {
    constructor(partial: { data: TData[]; meta: PaginatedListMetaContract }) {
      Object.assign(this, partial);
    }

    @Expose()
    @Type(() => dataDto)
    @ApiProperty({ type: dataDto, isArray: true })
    data!: TData[];

    @Expose()
    @Type(() => PaginatedListMetaResponseDto)
    @ApiProperty({ type: PaginatedListMetaResponseDto })
    meta!: PaginatedListMetaResponseDto;
  }

  return PaginatedResponseDto;
}
