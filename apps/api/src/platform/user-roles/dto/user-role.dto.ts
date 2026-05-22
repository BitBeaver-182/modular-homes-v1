import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserRoleResponse {
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
