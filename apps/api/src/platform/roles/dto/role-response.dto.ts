import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export interface RoleDto {
  id: string;
  name: string;
  description: string | null;
}

export class RoleResponse implements RoleDto {
  constructor(partial: Partial<RoleDto>) {
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
