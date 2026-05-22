import { Exclude, Expose, Type } from 'class-transformer';
import {
  OrganizationDto,
  OrganizationResponse,
} from '../../organizations/dto/organization-response.dto';

export interface UserDto {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  organizations: Partial<OrganizationDto>[];
}

export class UserResponse implements UserDto {
  constructor(partial: Partial<UserDto>) {
    Object.assign(this, partial);
  }

  @Expose()
  id!: string;

  @Expose()
  email!: string;

  @Expose()
  name!: string | null;

  @Expose()
  avatarUrl!: string | null;

  @Expose()
  @Type(() => OrganizationResponse)
  organizations!: Partial<OrganizationDto>[];

  @Exclude()
  deletedAt!: string | null;

  @Exclude()
  createdAt!: string;

  @Exclude()
  updatedAt!: string;
}
