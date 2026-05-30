import type { CreateRoleRequest } from '@moduflow/types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoleDto implements CreateRoleRequest {
  @ApiProperty({
    description: 'Role name.',
    example: 'Admin',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    description: 'Role description.',
    example: 'Can manage users and permissions.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
