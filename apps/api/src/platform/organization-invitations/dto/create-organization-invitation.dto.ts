import {
  CreateOrganizationInvitationRequest,
  GOVERNANCE_ROLES,
} from '@moduflow/types';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn } from 'class-validator';

export class CreateOrganizationInvitationDto implements CreateOrganizationInvitationRequest {
  @ApiProperty({
    example: 'invitee@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    enum: GOVERNANCE_ROLES,
    example: 'member',
  })
  @IsIn(GOVERNANCE_ROLES)
  governanceRole!: 'owner' | 'member';
}
