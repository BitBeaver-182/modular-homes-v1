import type { OrganizationResponse as OrganizationContract } from '@moduflow/types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class OrganizationResponse implements OrganizationContract {
  constructor(partial: OrganizationContract) {
    Object.assign(this, partial);
  }

  @Expose()
  @ApiProperty({ example: '1' })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'Northwind Homes' })
  name!: string;

  @Expose()
  @ApiProperty({ example: 'northwind-homes' })
  slug!: string;
}
