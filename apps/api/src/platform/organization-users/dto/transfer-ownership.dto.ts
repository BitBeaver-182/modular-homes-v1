import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TransferOwnershipDto {
  @ApiProperty({
    description: 'The current owner user id to demote after transfer.',
    example: '1',
  })
  @IsString()
  fromUserId!: string;
}
