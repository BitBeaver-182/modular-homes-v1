import type { AssignRolePermissionRequest } from '@moduflow/types';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignRolePermissionDto implements AssignRolePermissionRequest {
  @ApiProperty({
    description: 'Permission id to assign to the role.',
    example: '1',
  })
  @IsString()
  @IsNotEmpty()
  permissionId!: string;
}
