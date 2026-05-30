import type { CreateUserRequest } from '@moduflow/types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateUserDto implements CreateUserRequest {
  @ApiProperty({
    description: 'Unique email address for the user.',
    example: 'alex@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    description: 'Display name for the user.',
    example: 'Alex Johnson',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    description: 'Avatar image URL.',
    example: 'https://example.com/avatar.png',
    maxLength: 2048,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatarUrl?: string;
}
