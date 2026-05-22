import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class OrganizationInvitationOrganizationResponse {
  @Expose()
  @ApiProperty()
  id!: bigint;

  @Expose()
  @ApiProperty()
  name!: string;

  @Expose()
  @ApiProperty()
  slug!: string;
}
