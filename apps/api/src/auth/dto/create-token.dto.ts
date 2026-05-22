import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class CreateTokenDto {
  @ApiProperty({ example: 'owner@example.com' })
  @IsEmail()
  email!: string;
}
