import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { FileContext } from '@moduflow/types';
import { createClient } from '@supabase/supabase-js';
import { AppConfigService } from '../config/app-config.service';
import type { IStorageService } from './storage.service.interface';

@Injectable()
export class StorageService implements IStorageService {
  private supabase?: ReturnType<typeof createClient>;

  constructor(private readonly config: AppConfigService) {}

  bucketForContext(context: FileContext): string {
    return resolveBucketForContext(
      context,
      this.config.supabasePublicAssetsBucket,
      this.config.supabasePrivateDocumentsBucket,
    );
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
      this.config.supabaseSecretKey,
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

function resolveBucketForContext(
  context: FileContext,
  publicAssetsBucket: string,
  privateDocumentsBucket: string,
): string {
  switch (context) {
    case 'AVATAR':
    case 'ORGANIZATION_LOGO':
      return publicAssetsBucket;
    case 'SUPPLIER_DOCUMENT':
      return privateDocumentsBucket;
  }
}

function isPublicContext(context: FileContext): boolean {
  return context === 'AVATAR' || context === 'ORGANIZATION_LOGO';
}
