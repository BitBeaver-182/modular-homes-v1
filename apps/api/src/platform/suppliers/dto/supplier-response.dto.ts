import type {
  SupplierAddressResponse as SupplierAddressContract,
  SupplierListResponse as SupplierListContract,
  SupplierResponse as SupplierContract,
} from '@moduflow/types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { createPaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

export class SupplierResponse implements SupplierContract {
  constructor(partial: SupplierContract) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '1' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'Acme Supply' })
  @Expose()
  name!: string;

  @ApiPropertyOptional({
    type: String,
    example: '+1 555 0100',
    nullable: true,
  })
  @Expose()
  phoneNumber!: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'orders@example.com',
    nullable: true,
  })
  @Expose()
  email!: string | null;

  @ApiPropertyOptional({ type: () => SupplierAddressResponse, nullable: true })
  @Expose()
  @Type(() => SupplierAddressResponse)
  address!: SupplierAddressResponse | null;

  @ApiPropertyOptional({
    type: String,
    example: 'https://example.com',
    nullable: true,
  })
  @Expose()
  website!: string | null;

  @ApiProperty()
  @Expose()
  createdAt!: string;

  @ApiProperty()
  @Expose()
  updatedAt!: string;
}

export class SupplierAddressResponse implements SupplierAddressContract {
  constructor(partial: SupplierAddressContract) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '100 Main Street, Austin, TX 78701, US' })
  @Expose()
  fullAddress!: string;

  @ApiPropertyOptional({
    type: String,
    example: '100 Main Street',
    nullable: true,
  })
  @Expose()
  line1!: string | null;

  @ApiPropertyOptional({ type: String, example: 'Suite 200', nullable: true })
  @Expose()
  line2!: string | null;

  @ApiPropertyOptional({ type: String, example: 'Austin', nullable: true })
  @Expose()
  city!: string | null;

  @ApiPropertyOptional({ type: String, example: 'TX', nullable: true })
  @Expose()
  region!: string | null;

  @ApiPropertyOptional({ type: String, example: '78701', nullable: true })
  @Expose()
  postalCode!: string | null;

  @ApiPropertyOptional({ type: String, example: 'US', nullable: true })
  @Expose()
  countryCode!: string | null;
}

export class SupplierListResponse
  extends createPaginatedResponseDto(SupplierResponse)
  implements SupplierListContract {}
