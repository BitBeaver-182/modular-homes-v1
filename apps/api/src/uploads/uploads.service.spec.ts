import { NotFoundException } from '@nestjs/common';
import { UploadsService, buildStorageKey } from './uploads.service';

describe('UploadsService', () => {
  const prisma = {
    fileUpload: {
      create: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  const storageService = {
    bucketForContext: jest.fn(),
    presignUpload: jest.fn(),
    readUrl: jest.fn(),
    delete: jest.fn(),
  };
  const actor = {
    userId: 9n,
    email: 'owner@example.com',
    organizationId: 4n,
    governanceRole: 'owner' as const,
  };

  let service: UploadsService;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1_800_000);
    storageService.bucketForContext.mockReturnValue('private-documents');
    storageService.presignUpload.mockResolvedValue({
      uploadUrl: 'https://uploads.example.com/signed',
    });
    storageService.readUrl.mockResolvedValue('https://uploads.example.com/read');
    prisma.fileUpload.updateMany.mockResolvedValue({ count: 1 });
    service = new UploadsService(prisma as never, storageService as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a pending record scoped to the actor organization without filename in the key', async () => {
    const result = await service.presign(
      {
        filename: 'floor-plan.pdf',
        mimeType: 'application/pdf',
        context: 'SUPPLIER_DOCUMENT',
      },
      actor,
    );

    expect(result).toMatchObject({
      uploadUrl: 'https://uploads.example.com/signed',
      expiresIn: 300,
    });
    expect(result.fileId).toEqual(expect.any(String));
    expect(prisma.fileUpload.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: result.fileId,
        organizationId: 4n,
        uploadedById: 9n,
        bucket: 'private-documents',
        key: `4/SUPPLIER_DOCUMENT/${result.fileId}`,
        filename: 'floor-plan.pdf',
        mimeType: 'application/pdf',
        context: 'SUPPLIER_DOCUMENT',
        status: 'PENDING',
        expiresAt: new Date(2_100_000),
      }),
    });
    expect(prisma.fileUpload.create.mock.calls[0][0].data.key).not.toContain(
      'floor-plan.pdf',
    );
  });

  it('builds storage keys from organization, context, and file id only', () => {
    expect(buildStorageKey(4n, 'AVATAR', 'file_123')).toBe('4/AVATAR/file_123');
  });

  it('confirm throws NotFoundException when fileId belongs to a different org', async () => {
    prisma.fileUpload.findFirst.mockResolvedValue(null);

    await expect(service.confirm('file_123', actor)).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.fileUpload.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'file_123',
        organizationId: 4n,
        status: 'PENDING',
      },
    });
  });

  it('confirm deletes storage and marks expired pending uploads orphaned', async () => {
    prisma.fileUpload.findFirst.mockResolvedValue({
      id: 'file_123',
      organizationId: 4n,
      filename: 'floor-plan.pdf',
      mimeType: 'application/pdf',
      key: '4/SUPPLIER_DOCUMENT/file_123',
      context: 'SUPPLIER_DOCUMENT',
      status: 'PENDING',
      expiresAt: new Date(1_799_999),
      createdAt: new Date('2026-05-30T08:00:00.000Z'),
    });

    await expect(service.confirm('file_123', actor)).rejects.toThrow(
      NotFoundException,
    );

    expect(storageService.delete).toHaveBeenCalledWith(
      'SUPPLIER_DOCUMENT',
      '4/SUPPLIER_DOCUMENT/file_123',
    );
    expect(prisma.fileUpload.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'file_123',
        organizationId: 4n,
        status: 'PENDING',
      },
      data: { status: 'ORPHANED' },
    });
  });

  it('getSignedUrl throws NotFoundException when fileId belongs to a different org', async () => {
    prisma.fileUpload.findFirst.mockResolvedValue(null);

    await expect(service.getSignedUrl('file_123', actor)).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.fileUpload.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'file_123',
        organizationId: 4n,
        status: 'CONFIRMED',
      },
    });
  });
});
