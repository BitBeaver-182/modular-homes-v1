import { Exclude, Expose, Type } from 'class-transformer';
import {
  OrganizationDto,
  OrganizationResponse,
} from '../../organizations/dto/organization-response.dto';

export interface MembershipDto {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  organization?: Partial<OrganizationDto>;
}

export class MembershipResponse implements MembershipDto {
  constructor(partial: Partial<MembershipDto>) {
    Object.assign(this, partial);
  }

  @Expose()
  id!: string;

  @Exclude()
  userId!: string;

  @Expose()
  organizationId!: string;

  @Expose()
  role!: string;

  @Expose()
  @Type(() => OrganizationResponse)
  organization?: Partial<OrganizationDto>;

  @Exclude()
  createdAt!: string;

  @Exclude()
  updatedAt!: string;

  @Exclude()
  deletedAt!: string | null;
}
