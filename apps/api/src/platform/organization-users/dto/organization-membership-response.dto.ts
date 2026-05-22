import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

class MembershipUserSummary {
  @Expose()
  @ApiProperty()
  id!: bigint;

  @Expose()
  @ApiProperty()
  email!: string;

  @Expose()
  @ApiProperty({ nullable: true })
  name!: string | null;

  @Expose()
  @ApiProperty({ nullable: true })
  avatarUrl!: string | null;
}

export class OrganizationMembershipResponse {
  @Expose()
  @ApiProperty()
  id!: bigint;

  @Expose()
  @ApiProperty()
  organizationId!: bigint;

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
