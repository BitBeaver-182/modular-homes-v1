import type { RegisterUserRequest } from '@moduflow/types';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterUserDto implements RegisterUserRequest {
  @ApiProperty({
    example: 'owner@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'correct-horse-battery-staple',
    minLength: 8,
    maxLength: 256,
    format: 'password',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(256)
  password!: string;

  @ApiProperty({
    required: false,
    nullable: true,
    example: 'Owner User',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    required: false,
    nullable: true,
    example: 'https://example.com/avatar.png',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
