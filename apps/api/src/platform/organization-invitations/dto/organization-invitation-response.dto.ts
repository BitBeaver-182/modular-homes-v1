import type { OrganizationInvitationResponse as OrganizationInvitationContract } from '@moduflow/types';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Expose } from 'class-transformer';
import { OrganizationInvitationOrganizationResponse } from './organization-invitation-organization-response.dto';

export class OrganizationInvitationResponse implements OrganizationInvitationContract {
  constructor(partial: OrganizationInvitationContract) {
    Object.assign(this, partial);
  }

  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  organizationId!: string;

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

  @Expose()
  @Type(() => OrganizationInvitationOrganizationResponse)
  @ApiProperty({
    type: OrganizationInvitationOrganizationResponse,
    required: false,
  })
  organization?: OrganizationInvitationOrganizationResponse;
}
