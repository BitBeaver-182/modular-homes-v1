import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn } from 'class-validator';

export class CreateOrganizationInvitationDto {
  @ApiProperty({
    example: 'invitee@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    enum: ['owner', 'member'],
    example: 'member',
  })
  @IsIn(['owner', 'member'])
  governanceRole!: 'owner' | 'member';
}
