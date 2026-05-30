import type { FileUploadResponse } from '@moduflow/types';
import type { FileUpload } from '@prisma/client';
import { toIsoDateString } from '../../common/mappers/transport';
import type { IStorageService } from '../../storage/storage.service.interface';

export type FileUploadRecord = Pick<
  FileUpload,
  'id' | 'filename' | 'mimeType' | 'key' | 'context' | 'status' | 'createdAt'
>;

export class FileUploadMapper {
  static async toResponse(
    fileUpload: FileUploadRecord,
    storageService: IStorageService,
  ): Promise<FileUploadResponse> {
    return {
      id: fileUpload.id,
      filename: fileUpload.filename,
      mimeType: fileUpload.mimeType,
      url: await storageService.readUrl(
        fileUpload.context,
        fileUpload.key,
        3600,
      ),
      context: fileUpload.context,
      status: fileUpload.status,
      uploadedAt: toIsoDateString(fileUpload.createdAt),
    };
  }
}
