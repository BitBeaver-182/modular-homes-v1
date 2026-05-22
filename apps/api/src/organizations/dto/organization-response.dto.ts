import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

export interface OrganizationDto {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export class OrganizationResponse implements OrganizationDto {
  constructor(partial: Partial<OrganizationDto>) {
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

  @Exclude()
  createdAt!: string;

  @Exclude()
  updatedAt!: string;

  @Exclude()
  deletedAt!: string | null;
}
