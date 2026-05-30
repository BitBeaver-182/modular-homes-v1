import type { RoleResponse as RoleContract } from '@moduflow/types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class RoleResponse implements RoleContract {
  constructor(partial: RoleContract) {
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
    example: 'Can manage users and permissions.',
    nullable: true,
  })
  description!: string | null;
}
