import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { FileContext } from '@moduflow/types';
import { createClient } from '@supabase/supabase-js';
import { AppConfigService } from '../config/app-config.service';
import type { IStorageService } from './storage.service.interface';

export const PUBLIC_ASSETS_BUCKET = 'public-assets';
export const PRIVATE_DOCUMENTS_BUCKET = 'private-documents';

@Injectable()
export class StorageService implements IStorageService {
  private readonly supabase: ReturnType<typeof createClient>;

  constructor(config: AppConfigService) {
    this.supabase = createClient(
      config.supabaseUrl,
      config.supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  bucketForContext(context: FileContext): string {
    return bucketFor(context);
  }

  async presignUpload(
    context: FileContext,
    key: string,
    mimeType: string,
  ): Promise<{ uploadUrl: string }> {
    void mimeType;
    const bucket = this.bucketForContext(context);
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUploadUrl(key);

    if (error) {
      throw new InternalServerErrorException('Failed to create upload URL');
    }

    return { uploadUrl: data.signedUrl };
  }

  async readUrl(
    context: FileContext,
    key: string,
    ttlSeconds: number,
  ): Promise<string> {
    const bucket = this.bucketForContext(context);

    if (isPublicContext(context)) {
      return this.supabase.storage.from(bucket).getPublicUrl(key).data
        .publicUrl;
    }

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(key, ttlSeconds);

    if (error) {
      throw new InternalServerErrorException('Failed to create read URL');
    }

    return data.signedUrl;
  }

  async delete(context: FileContext, key: string): Promise<void> {
    const bucket = this.bucketForContext(context);
    const { error } = await this.supabase.storage.from(bucket).remove([key]);

    if (error) {
      throw new InternalServerErrorException('Failed to delete stored file');
    }
  }
}

export function bucketFor(context: FileContext): string {
  switch (context) {
    case 'AVATAR':
    case 'ORGANIZATION_LOGO':
      return PUBLIC_ASSETS_BUCKET;
    case 'SUPPLIER_DOCUMENT':
      return PRIVATE_DOCUMENTS_BUCKET;
  }
}

function isPublicContext(context: FileContext): boolean {
  return context === 'AVATAR' || context === 'ORGANIZATION_LOGO';
}
