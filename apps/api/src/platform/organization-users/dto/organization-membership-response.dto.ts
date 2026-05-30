import type { OrganizationMembershipResponse as OrganizationMembershipContract } from '@moduflow/types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

type OrganizationMembershipUserContract =
  OrganizationMembershipContract['user'];

class MembershipUserSummary implements OrganizationMembershipUserContract {
  constructor(partial: OrganizationMembershipUserContract) {
    Object.assign(this, partial);
  }

  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  email!: string;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  name!: string | null;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  avatarUrl!: string | null;
}

export class OrganizationMembershipResponse implements OrganizationMembershipContract {
  constructor(partial: OrganizationMembershipContract) {
    Object.assign(this, partial);
  }

  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  organizationId!: string;

  @Expose()
  @ApiProperty({ enum: ['owner', 'member'] })
  governanceRole!: 'owner' | 'member';

  @Expose()
  @ApiProperty({ enum: ['invited', 'active', 'removed'] })
  status!: 'invited' | 'active' | 'removed';

  @Expose()
  @Type(() => MembershipUserSummary)
  @ApiProperty({ type: MembershipUserSummary })
  user!: MembershipUserSummary;
}
