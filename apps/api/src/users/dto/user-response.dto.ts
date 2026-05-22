import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  OrganizationDto,
  OrganizationResponse,
} from '../../organizations/dto/organization-response.dto';
import { RoleDto, RoleResponse } from '../../roles/dto/role-response.dto';

export interface UserDto {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  organization: Partial<OrganizationDto> | null;
  roles: Partial<RoleDto>[];
}

export class UserResponse implements UserDto {
  constructor(partial: Partial<UserDto>) {
    Object.assign(this, partial);
  }

  @Expose()
  @ApiProperty({ example: '1' })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'alex@example.com' })
  email!: string;

  @Expose()
  @ApiProperty({ example: 'Alex Johnson', nullable: true })
  name!: string | null;

  @Expose()
  @ApiProperty({
    example: 'https://example.com/avatar.png',
    nullable: true,
  })
  avatarUrl!: string | null;

  @Expose()
  @Type(() => OrganizationResponse)
  @ApiProperty({ type: () => OrganizationResponse, nullable: true })
  organization!: Partial<OrganizationDto> | null;

  @Expose()
  @Type(() => RoleResponse)
  @ApiProperty({ type: () => RoleResponse, isArray: true })
  roles!: Partial<RoleDto>[];

  @Exclude()
  deletedAt!: string | null;

  @Exclude()
  createdAt!: string;

  @Exclude()
  updatedAt!: string;
}
