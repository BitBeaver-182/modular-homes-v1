import type { RolePermissionResponse as RolePermissionContract } from '@moduflow/types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class RolePermissionResponse implements RolePermissionContract {
  constructor(partial: RolePermissionContract) {
    Object.assign(this, partial);
  }

  @Expose()
  @ApiProperty({ example: '1' })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'users.manage' })
  key!: string;

  @Expose()
  @ApiProperty({
    type: String,
    example: 'Allows managing users.',
    nullable: true,
  })
  description!: string | null;
}
