import type { PresignUploadRequest } from '@moduflow/types';
import { FILE_CONTEXTS } from '@moduflow/types';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class PresignUploadBodyDto implements PresignUploadRequest {
  @ApiProperty({ example: 'floor-plan.pdf', maxLength: 255 })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^[\w\-. ]+$/, {
    message:
      'filename may only contain letters, numbers, underscores, dashes, dots, and spaces',
  })
  filename!: string;

  @ApiProperty({ example: 'application/pdf' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  mimeType!: string;

  @ApiProperty({ enum: FILE_CONTEXTS, example: 'SUPPLIER_DOCUMENT' })
  @IsIn(FILE_CONTEXTS)
  context!: PresignUploadRequest['context'];
}
