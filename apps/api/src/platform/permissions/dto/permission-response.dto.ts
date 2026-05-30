import type { PermissionResponse as PermissionContract } from '@moduflow/types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PermissionResponse implements PermissionContract {
  constructor(partial: PermissionContract) {
    Object.assign(this, partial);
  }

  @Expose()
  @ApiProperty({ example: '1' })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'users.manage' })
  key!: string;

  @Expose()
  @ApiProperty({ example: 'Allows managing users.', nullable: true })
  description!: string | null;
}
