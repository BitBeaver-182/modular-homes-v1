import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    description: 'Permission key.',
    example: 'users.manage',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  key!: string;

  @ApiPropertyOptional({
    description: 'Permission description.',
    example: 'Allows managing users.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
