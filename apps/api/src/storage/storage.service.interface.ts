import type { FileContext } from '@moduflow/types';

export interface IStorageService {
  presignUpload(
    context: FileContext,
    key: string,
    mimeType: string,
  ): Promise<{ uploadUrl: string }>;
  readUrl(context: FileContext, key: string, ttlSeconds: number): Promise<string>;
  delete(context: FileContext, key: string): Promise<void>;
}
