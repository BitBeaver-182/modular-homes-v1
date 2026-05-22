import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({
    example: 'owner@example.com',
  })
  @IsEmail()
  email!: string;

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
