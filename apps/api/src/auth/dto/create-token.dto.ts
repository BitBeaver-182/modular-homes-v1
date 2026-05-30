import type { CreateTokenRequest } from '@moduflow/types';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTokenDto implements CreateTokenRequest {
  @ApiProperty({ example: 'owner@example.com' })
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
}
