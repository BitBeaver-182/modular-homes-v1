import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SupplierResponse {
  @ApiProperty({ example: '1' })
  @Expose()
  id!: bigint;

  @ApiProperty({ example: 'Acme Supply' })
  @Expose()
  name!: string;

  @ApiPropertyOptional({ example: '+1 555 0100', nullable: true })
  @Expose()
  phoneNumber!: string | null;

  @ApiPropertyOptional({ example: 'orders@example.com', nullable: true })
  @Expose()
  email!: string | null;

  @ApiPropertyOptional({ example: '100 Main Street', nullable: true })
  @Expose()
  address!: string | null;

  @ApiPropertyOptional({ example: 'https://example.com', nullable: true })
  @Expose()
  website!: string | null;

  @ApiProperty()
  @Expose()
  createdAt!: Date;

  @ApiProperty()
  @Expose()
  updatedAt!: Date;
}

export class SupplierPaginationResponse {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 15 })
  pageSize!: number;

  @ApiProperty({ example: 3 })
  pageCount!: number;

  @ApiProperty({ example: 42 })
  total!: number;
}

export class SupplierListMetaResponse {
  @ApiProperty({ type: SupplierPaginationResponse })
  pagination!: SupplierPaginationResponse;
}

export class SupplierListResponse {
  @ApiProperty({ type: SupplierResponse, isArray: true })
  data!: SupplierResponse[];

  @ApiProperty({ type: SupplierListMetaResponse })
  meta!: SupplierListMetaResponse;
}
