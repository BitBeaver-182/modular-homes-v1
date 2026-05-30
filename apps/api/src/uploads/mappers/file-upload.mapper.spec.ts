import { FileUploadMapper } from './file-upload.mapper';

describe('FileUploadMapper', () => {
  it('maps createdAt Date to ISO string and gets URL from storage service', async () => {
    const createdAt = new Date('2026-05-30T08:00:00.000Z');
    const storageService = {
      readUrl: jest.fn().mockResolvedValue('https://files.example.com/read'),
    };

    await expect(
      FileUploadMapper.toResponse(
        {
          id: 'file_123',
          filename: 'floor-plan.pdf',
          mimeType: 'application/pdf',
          key: '4/SUPPLIER_DOCUMENT/file_123',
          context: 'SUPPLIER_DOCUMENT',
          status: 'CONFIRMED',
          createdAt,
        },
        storageService as never,
      ),
    ).resolves.toEqual({
      id: 'file_123',
      filename: 'floor-plan.pdf',
      mimeType: 'application/pdf',
      url: 'https://files.example.com/read',
      context: 'SUPPLIER_DOCUMENT',
      status: 'CONFIRMED',
      uploadedAt: createdAt.toISOString(),
    });
    expect(storageService.readUrl).toHaveBeenCalledWith(
      'SUPPLIER_DOCUMENT',
      '4/SUPPLIER_DOCUMENT/file_123',
      3600,
    );
  });
});
