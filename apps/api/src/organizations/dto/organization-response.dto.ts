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
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  slug!: string;

  @Exclude()
  createdAt!: string;

  @Exclude()
  updatedAt!: string;

  @Exclude()
  deletedAt!: string | null;
}
