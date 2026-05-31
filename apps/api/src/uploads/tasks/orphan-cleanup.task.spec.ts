import { OrphanCleanupTask } from './orphan-cleanup.task';

describe('OrphanCleanupTask', () => {
  const prisma = {
    fileUpload: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  const storageService = {
    delete: jest.fn(),
  };

  let task: OrphanCleanupTask;

  beforeEach(() => {
    jest.resetAllMocks();
    task = new OrphanCleanupTask(prisma as never, storageService as never);
  });

  it('retires stale confirmed supplier uploads that are not linked to an active quote', async () => {
    prisma.fileUpload.findMany.mockResolvedValue([
      {
        id: 'file_123',
        organizationId: 4n,
        context: 'SUPPLIER_DOCUMENT',
        key: '4/SUPPLIER_DOCUMENT/file_123',
      },
    ]);
    prisma.fileUpload.updateMany.mockResolvedValue({ count: 1 });

    await task.cleanupStaleConfirmedSupplierUploads();

    expect(prisma.fileUpload.findMany).toHaveBeenCalledWith({
      where: {
        status: 'CONFIRMED',
        context: 'SUPPLIER_DOCUMENT',
        expiresAt: { not: null },
        confirmedAt: { lt: expect.any(Date) },
        OR: [
          { supplierQuote: null },
          { supplierQuote: { is: { deletedAt: { not: null } } } },
        ],
      },
    });
    expect(prisma.fileUpload.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'file_123',
        organizationId: 4n,
        status: 'CONFIRMED',
      },
      data: {
        status: 'DELETED',
      },
    });
    expect(storageService.delete).toHaveBeenCalledWith(
      'SUPPLIER_DOCUMENT',
      '4/SUPPLIER_DOCUMENT/file_123',
    );
    expect(prisma.fileUpload.deleteMany).toHaveBeenCalledWith({
      where: {
        id: 'file_123',
        organizationId: 4n,
        status: 'DELETED',
      },
    });
  });
});
