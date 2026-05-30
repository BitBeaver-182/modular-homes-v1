import type { OrganizationInvitationOrganizationResponse as InvitationOrganizationContract } from '@moduflow/types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class OrganizationInvitationOrganizationResponse implements InvitationOrganizationContract {
  constructor(partial: InvitationOrganizationContract) {
    Object.assign(this, partial);
  }

  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  name!: string;

  @Expose()
  @ApiProperty()
  slug!: string;
}
