import type { UserRoleResponse as UserRoleContract } from '@moduflow/types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserRoleResponse implements UserRoleContract {
  constructor(partial: UserRoleContract) {
    Object.assign(this, partial);
  }

  @Expose()
  @ApiProperty({ example: '1' })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'Admin' })
  name!: string;

  @Expose()
  @ApiProperty({
    type: String,
    example: 'Can manage users and permissions.',
    nullable: true,
  })
  description!: string | null;
}
