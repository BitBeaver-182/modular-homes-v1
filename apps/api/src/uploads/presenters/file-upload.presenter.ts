import type {
  FileContext,
  FileUploadResponse as FileUploadContract,
  FileUploadStatus,
} from '@moduflow/types';
import { FILE_CONTEXTS, FILE_UPLOAD_STATUSES } from '@moduflow/types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class FileUploadPresenter implements FileUploadContract {
  constructor(partial: FileUploadContract) {
    Object.assign(this, partial);
  }

  @Expose()
  @ApiProperty({ example: 'ckvxo0n1a000001l46me8xz6u' })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'floor-plan.pdf' })
  filename!: string;

  @Expose()
  @ApiProperty({ example: 'application/pdf' })
  mimeType!: string;

  @Expose()
  @ApiProperty({ example: 'https://example.supabase.co/storage/v1/object/...' })
  url!: string;

  @Expose()
  @ApiProperty({ enum: FILE_CONTEXTS })
  context!: FileContext;

  @Expose()
  @ApiProperty({ enum: FILE_UPLOAD_STATUSES })
  status!: FileUploadStatus;

  @Expose()
  @ApiProperty({ example: '2026-05-30T08:00:00.000Z' })
  uploadedAt!: string;
}

export class PresignUploadPresenter {
  constructor(partial: PresignUploadPresenter) {
    Object.assign(this, partial);
  }

  @Expose()
  @ApiProperty({ example: 'ckvxo0n1a000001l46me8xz6u' })
  fileId!: string;

  @Expose()
  @ApiProperty({
    example:
      'https://example.supabase.co/storage/v1/object/upload/sign/<bucket>/...',
  })
  uploadUrl!: string;

  @Expose()
  @ApiProperty({ example: 300 })
  expiresIn!: number;
}

export class SignedReadUrlPresenter {
  constructor(partial: SignedReadUrlPresenter) {
    Object.assign(this, partial);
  }

  @Expose()
  @ApiProperty({ example: 'https://example.supabase.co/storage/v1/object/...' })
  url!: string;
}
