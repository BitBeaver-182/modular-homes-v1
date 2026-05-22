import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignUserRoleDto {
  @ApiProperty({
    description: 'Role id to assign to the user.',
    example: '1',
  })
  @IsString()
  @IsNotEmpty()
  roleId!: string;
}
