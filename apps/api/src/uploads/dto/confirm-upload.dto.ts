import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class FileUploadParamsDto {
  @ApiProperty({ example: 'ckvxo0n1a000001l46me8xz6u' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  fileId!: string;
}
