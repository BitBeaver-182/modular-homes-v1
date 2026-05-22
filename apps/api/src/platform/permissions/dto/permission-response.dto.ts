import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export interface PermissionDto {
  id: string;
  key: string;
  description: string | null;
}

export class PermissionResponse implements PermissionDto {
  constructor(partial: Partial<PermissionDto>) {
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
