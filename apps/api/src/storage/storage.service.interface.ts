import type { FileContext } from '@moduflow/types';

export interface IStorageService {
  bucketForContext(context: FileContext): string;
  presignUpload(
    context: FileContext,
    key: string,
    mimeType: string,
  ): Promise<{ uploadUrl: string }>;
  readUrl(
    context: FileContext,
    key: string,
    ttlSeconds: number,
  ): Promise<string>;
  exists(context: FileContext, key: string): Promise<boolean>;
  delete(context: FileContext, key: string): Promise<void>;
}
