import { NotFoundException } from '@nestjs/common';
import { UploadsService, buildStorageKey } from './uploads.service';

describe('UploadsService', () => {
  const prisma = {
    fileUpload: {
      create: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    supplierQuote: {
      findFirst: jest.fn(),
    },
  };
  const storageService = {
    bucketForContext: jest.fn(),
    presignUpload: jest.fn(),
    readUrl: jest.fn(),
    exists: jest.fn(),
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
    storageService.readUrl.mockResolvedValue(
      'https://uploads.example.com/read',
    );
    storageService.exists.mockResolvedValue(true);
    prisma.fileUpload.updateMany.mockResolvedValue({ count: 1 });
    prisma.supplierQuote.findFirst.mockResolvedValue(null);
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
      // Jest asymmetric matchers are typed as any.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
    // Jest mock call arguments are typed as any.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const createCall = prisma.fileUpload.create.mock.calls[0]?.[0] as
      | { data: { key: string } }
      | undefined;
    expect(createCall?.data.key).not.toContain('floor-plan.pdf');
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

  it('confirm throws NotFoundException when the storage object does not exist', async () => {
    prisma.fileUpload.findFirst.mockResolvedValue({
      id: 'file_123',
      organizationId: 4n,
      filename: 'floor-plan.pdf',
      mimeType: 'application/pdf',
      key: '4/SUPPLIER_DOCUMENT/file_123',
      context: 'SUPPLIER_DOCUMENT',
      status: 'PENDING',
      expiresAt: new Date(1_800_001),
      createdAt: new Date('2026-05-30T08:00:00.000Z'),
    });
    storageService.exists.mockResolvedValue(false);

    await expect(service.confirm('file_123', actor)).rejects.toThrow(
      NotFoundException,
    );

    expect(storageService.exists).toHaveBeenCalledWith(
      'SUPPLIER_DOCUMENT',
      '4/SUPPLIER_DOCUMENT/file_123',
    );
    expect(prisma.fileUpload.updateMany).not.toHaveBeenCalled();
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

  it('remove deletes an unlinked upload in the active organization', async () => {
    prisma.fileUpload.findFirst.mockResolvedValue({
      id: 'file_123',
      organizationId: 4n,
      context: 'SUPPLIER_DOCUMENT',
      key: '4/SUPPLIER_DOCUMENT/file_123',
      status: 'CONFIRMED',
    });

    await expect(service.remove('file_123', actor)).resolves.toBeUndefined();

    expect(prisma.supplierQuote.findFirst).toHaveBeenCalledWith({
      where: {
        organizationId: 4n,
        attachmentId: 'file_123',
        deletedAt: null,
      },
      select: { id: true },
    });
    expect(storageService.delete).toHaveBeenCalledWith(
      'SUPPLIER_DOCUMENT',
      '4/SUPPLIER_DOCUMENT/file_123',
    );
    expect(prisma.fileUpload.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'file_123',
        organizationId: 4n,
        status: { not: 'DELETED' },
      },
      data: { status: 'DELETED' },
    });
  });

  it('remove still retires the upload when storage deletion fails', async () => {
    prisma.fileUpload.findFirst.mockResolvedValue({
      id: 'file_123',
      organizationId: 4n,
      context: 'SUPPLIER_DOCUMENT',
      key: '4/SUPPLIER_DOCUMENT/file_123',
      status: 'CONFIRMED',
    });
    storageService.delete.mockRejectedValueOnce(new Error('boom'));

    await expect(service.remove('file_123', actor)).resolves.toBeUndefined();

    expect(prisma.fileUpload.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'file_123',
        organizationId: 4n,
        status: { not: 'DELETED' },
      },
      data: { status: 'DELETED' },
    });
  });
});
