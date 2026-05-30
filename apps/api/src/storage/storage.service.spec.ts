import { InternalServerErrorException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { StorageService } from './storage.service';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('StorageService', () => {
  const bucketApi = {
    createSignedUploadUrl: jest.fn(),
    createSignedUrl: jest.fn(),
    exists: jest.fn(),
    getPublicUrl: jest.fn(),
    remove: jest.fn(),
  };
  const supabase = {
    storage: {
      from: jest.fn(),
    },
  };
  const config = {
    supabaseUrl: 'https://project.supabase.co',
    supabaseSecretKey: 'secret-key',
    supabasePublicAssetsBucket: 'public-assets',
    supabasePrivateDocumentsBucket: 'private-documents',
  };

  let service: StorageService;

  beforeEach(() => {
    jest.resetAllMocks();
    (createClient as jest.Mock).mockReturnValue(supabase);
    supabase.storage.from.mockReturnValue(bucketApi);
    bucketApi.createSignedUploadUrl.mockResolvedValue({
      data: { signedUrl: 'https://uploads.example.com/signed' },
      error: null,
    });
    bucketApi.createSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://uploads.example.com/read-signed' },
      error: null,
    });
    bucketApi.getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://uploads.example.com/public' },
    });
    bucketApi.exists.mockResolvedValue({ data: true, error: null });
    bucketApi.remove.mockResolvedValue({ error: null });
    service = new StorageService(config as never);
  });

  it('does not read Supabase credentials until storage is used', () => {
    const lazyConfig = {
      get supabaseUrl(): string {
        throw new Error('SUPABASE_URL missing');
      },
      get supabaseSecretKey(): string {
        throw new Error('SUPABASE_SECRET_KEY missing');
      },
      get supabasePublicAssetsBucket(): string {
        return 'public-assets';
      },
      get supabasePrivateDocumentsBucket(): string {
        return 'private-documents';
      },
    };

    expect(() => new StorageService(lazyConfig as never)).not.toThrow();
  });

  it('maps contexts to buckets in one place', () => {
    expect(service.bucketForContext('AVATAR')).toBe('public-assets');
    expect(service.bucketForContext('ORGANIZATION_LOGO')).toBe('public-assets');
    expect(service.bucketForContext('SUPPLIER_DOCUMENT')).toBe(
      'private-documents',
    );
  });

  it('returns public URLs for public contexts', async () => {
    await expect(
      service.readUrl('AVATAR', '4/AVATAR/file_123', 3600),
    ).resolves.toBe('https://uploads.example.com/public');

    expect(supabase.storage.from).toHaveBeenCalledWith('public-assets');
    expect(bucketApi.getPublicUrl).toHaveBeenCalledWith('4/AVATAR/file_123');
    expect(bucketApi.createSignedUrl).not.toHaveBeenCalled();
  });

  it('returns signed URLs for private contexts', async () => {
    await expect(
      service.readUrl(
        'SUPPLIER_DOCUMENT',
        '4/SUPPLIER_DOCUMENT/file_123',
        3600,
      ),
    ).resolves.toBe('https://uploads.example.com/read-signed');

    expect(supabase.storage.from).toHaveBeenCalledWith('private-documents');
    expect(bucketApi.createSignedUrl).toHaveBeenCalledWith(
      '4/SUPPLIER_DOCUMENT/file_123',
      3600,
    );
  });

  it('checks object existence through the context bucket', async () => {
    await expect(
      service.exists('SUPPLIER_DOCUMENT', '4/SUPPLIER_DOCUMENT/file_123'),
    ).resolves.toBe(true);

    expect(supabase.storage.from).toHaveBeenCalledWith('private-documents');
    expect(bucketApi.exists).toHaveBeenCalledWith(
      '4/SUPPLIER_DOCUMENT/file_123',
    );
  });

  it('throws when Supabase cannot create a signed upload URL', async () => {
    bucketApi.createSignedUploadUrl.mockResolvedValue({
      data: null,
      error: new Error('failed'),
    });

    await expect(
      service.presignUpload(
        'SUPPLIER_DOCUMENT',
        '4/SUPPLIER_DOCUMENT/file_123',
        'application/pdf',
      ),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
