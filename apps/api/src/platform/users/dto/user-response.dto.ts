import type { UserResponse as UserContract } from '@moduflow/types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { OrganizationResponse } from '../../../global/organizations/dto/organization-response.dto';
import { RoleResponse } from '../../roles/dto/role-response.dto';

export class UserResponse implements UserContract {
  constructor(partial: UserContract) {
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
  organization!: OrganizationResponse | null;

  @Expose()
  @Type(() => RoleResponse)
  @ApiProperty({ type: () => RoleResponse, isArray: true })
  roles!: RoleResponse[];
}
