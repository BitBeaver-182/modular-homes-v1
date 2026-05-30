import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { FileContext } from '@moduflow/types';
import { createClient } from '@supabase/supabase-js';
import { AppConfigService } from '../config/app-config.service';
import type { IStorageService } from './storage.service.interface';

export const PUBLIC_ASSETS_BUCKET = 'public-assets';
export const PRIVATE_DOCUMENTS_BUCKET = 'private-documents';

@Injectable()
export class StorageService implements IStorageService {
  private supabase?: ReturnType<typeof createClient>;

  constructor(private readonly config: AppConfigService) {}

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
    const { data, error } = await this.getSupabaseClient()
      .storage.from(bucket)
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
      return this.getSupabaseClient().storage.from(bucket).getPublicUrl(key)
        .data.publicUrl;
    }

    const { data, error } = await this.getSupabaseClient()
      .storage.from(bucket)
      .createSignedUrl(key, ttlSeconds);

    if (error) {
      throw new InternalServerErrorException('Failed to create read URL');
    }

    return data.signedUrl;
  }

  async exists(context: FileContext, key: string): Promise<boolean> {
    const bucket = this.bucketForContext(context);
    const { data, error } = await this.getSupabaseClient()
      .storage.from(bucket)
      .exists(key);

    if (error && data) {
      throw new InternalServerErrorException('Failed to verify stored file');
    }

    return data;
  }

  async delete(context: FileContext, key: string): Promise<void> {
    const bucket = this.bucketForContext(context);
    const { error } = await this.getSupabaseClient()
      .storage.from(bucket)
      .remove([key]);

    if (error) {
      throw new InternalServerErrorException('Failed to delete stored file');
    }
  }

  private getSupabaseClient(): ReturnType<typeof createClient> {
    this.supabase ??= createClient(
      this.config.supabaseUrl,
      this.config.supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    return this.supabase;
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
