import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  key!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
