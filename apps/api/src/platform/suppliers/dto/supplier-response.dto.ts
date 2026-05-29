import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';

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
  @Transform(({ obj }: { obj: SupplierAddressSource }) => {
    const address = obj.address;

    if (!address || address.deletedAt) {
      return null;
    }

    return {
      fullAddress: formatFullAddress(address),
      line1: address.line1 ?? null,
      line2: address.line2 ?? null,
      city: address.city ?? null,
      region: address.region ?? null,
      postalCode: address.postalCode ?? null,
      countryCode: address.countryCode ?? null,
    };
  })
  @Type(() => SupplierAddressResponse)
  address!: SupplierAddressResponse | null;

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

interface SupplierAddressSource {
  address?: SupplierAddressRecord | null;
}

interface SupplierAddressRecord {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
  deletedAt?: Date | null;
}

function formatFullAddress(address: SupplierAddressRecord): string {
  const regionPostalCode = [address.region, address.postalCode]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');

  return [address.line1, address.line2, address.city, regionPostalCode, address.countryCode]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');
}

export class SupplierAddressResponse {
  @ApiProperty({ example: '100 Main Street, Austin, TX 78701, US' })
  @Expose()
  fullAddress!: string;

  @ApiPropertyOptional({ example: '100 Main Street', nullable: true })
  @Expose()
  line1!: string | null;

  @ApiPropertyOptional({ example: 'Suite 200', nullable: true })
  @Expose()
  line2!: string | null;

  @ApiPropertyOptional({ example: 'Austin', nullable: true })
  @Expose()
  city!: string | null;

  @ApiPropertyOptional({ example: 'TX', nullable: true })
  @Expose()
  region!: string | null;

  @ApiPropertyOptional({ example: '78701', nullable: true })
  @Expose()
  postalCode!: string | null;

  @ApiPropertyOptional({ example: 'US', nullable: true })
  @Expose()
  countryCode!: string | null;
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
