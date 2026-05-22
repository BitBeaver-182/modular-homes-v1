import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class OrganizationInvitationResponse {
  @Expose()
  @ApiProperty()
  id!: bigint;

  @Expose()
  @ApiProperty()
  organizationId!: bigint;

  @Expose()
  @ApiProperty()
  email!: string;

  @Expose()
  @ApiProperty({ enum: ['owner', 'member'] })
  governanceRole!: 'owner' | 'member';

  @Expose()
  @ApiProperty({
    enum: ['pending', 'accepted', 'expired', 'revoked', 'rejected'],
  })
  status!: 'pending' | 'accepted' | 'expired' | 'revoked' | 'rejected';
}
