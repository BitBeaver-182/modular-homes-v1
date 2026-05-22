import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class RolePermissionResponse {
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
