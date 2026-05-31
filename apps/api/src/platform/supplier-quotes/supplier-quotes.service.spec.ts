/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SupplierQuotesService } from './supplier-quotes.service';

interface PrismaMock {
  $transaction: jest.Mock;
  fileUpload: {
    findFirst: jest.Mock;
    updateMany: jest.Mock;
  };
  supplier: {
    findFirst: jest.Mock;
  };
  supplierQuote: {
    count: jest.Mock;
    create: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
  };
  supplierQuoteLine: {
    deleteMany: jest.Mock;
  };
}

type TransactionInput =
  | ((client: PrismaMock) => unknown)
  | ReadonlyArray<unknown>;

describe('SupplierQuotesService', () => {
  const prisma: PrismaMock = {
    $transaction: jest.fn(),
    fileUpload: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    supplier: {
      findFirst: jest.fn(),
    },
    supplierQuote: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    supplierQuoteLine: {
      deleteMany: jest.fn(),
    },
  };
  const storageService = {
    delete: jest.fn(),
  };
  const actor = {
    userId: 9n,
    email: 'buyer@example.com',
    organizationId: 4n,
    governanceRole: 'member' as const,
  };

  let service: SupplierQuotesService;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation(
      (input: TransactionInput): Promise<unknown> => {
        if (typeof input === 'function') {
          return Promise.resolve(input(prisma));
        }

        return Promise.all(input);
      },
    );
    prisma.supplier.findFirst.mockResolvedValue({ id: 8n });
    prisma.fileUpload.findFirst.mockResolvedValue(null);
    prisma.fileUpload.updateMany.mockResolvedValue({ count: 1 });
    prisma.supplierQuote.findFirst.mockResolvedValue(null);
    service = new SupplierQuotesService(
      prisma as never,
      storageService as never,
    );
  });

  it('creates quotes scoped to the actor organization and calculates line totals', async () => {
    prisma.supplierQuote.create.mockResolvedValue({ id: 1n });

    await service.create(actor, {
      supplierId: '8',
      quoteNumber: ' SQ-001 ',
      currencyCode: ' eur ',
      shippingAmount: 100,
      taxAmount: 50,
      lines: [
        {
          description: ' Model A ',
          quantity: 2,
          unitCost: 1000,
        },
      ],
    });

    expect(prisma.supplier.findFirst).toHaveBeenCalledWith({
      where: { id: 8n, organizationId: 4n, deletedAt: null },
      select: { id: true },
    });
    expect(prisma.supplierQuote.create).toHaveBeenCalledWith({
      // Jest asymmetric matchers are typed as any.

      data: expect.objectContaining({
        organizationId: 4n,
        supplierId: 8n,
        quoteNumber: 'SQ-001',
        status: 'received',
        currencyCode: 'EUR',
        subtotalAmount: new Prisma.Decimal('2000.00'),
        shippingAmount: new Prisma.Decimal('100.00'),
        taxAmount: new Prisma.Decimal('50.00'),
        totalAmount: new Prisma.Decimal('2150.00'),
        lines: {
          create: [
            expect.objectContaining({
              organizationId: 4n,
              description: 'Model A',
              quantity: 2,
              unitCost: new Prisma.Decimal('1000.00'),
              lineTotal: new Prisma.Decimal('2000.00'),
            }),
          ],
        },
      }),
      // Jest asymmetric matchers are typed as any.

      include: expect.any(Object),
    });
  });

  it('rejects quote windows where valid until is before the quote date', async () => {
    await expect(
      service.create(actor, {
        supplierId: '8',
        quoteDate: '2026-06-10',
        validUntil: '2026-06-01',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.supplierQuote.create).not.toHaveBeenCalled();
  });

  it('rejects attachments outside the active organization or not confirmed', async () => {
    prisma.fileUpload.findFirst.mockResolvedValue(null);

    await expect(
      service.create(actor, {
        supplierId: '8',
        attachmentId: 'file_123',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.fileUpload.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'file_123',
        organizationId: 4n,
        context: 'SUPPLIER_DOCUMENT',
        status: 'CONFIRMED',
      },
      select: { id: true },
    });
    expect(prisma.supplierQuote.create).not.toHaveBeenCalled();
  });

  it('lists quotes with organization scope, filters, and safe sorting', async () => {
    prisma.supplierQuote.findMany.mockResolvedValue([{ id: 1n }]);
    prisma.supplierQuote.count.mockResolvedValue(1);

    await service.findAll(4n, {
      page: 1,
      limit: 25,
      search: 'sq',
      status: ['received', 'accepted'],
      supplierIds: ['8'],
      quoteDateFrom: '2026-05-01',
      quoteDateTo: '2026-05-31',
      totalAmountMin: 100,
      totalAmountMax: 2000,
      sortField: 'supplier.name',
      sortCriteria: 'asc',
    });

    expect(prisma.supplierQuote.findMany).toHaveBeenCalledWith({
      // Jest asymmetric matchers are typed as any.

      where: expect.objectContaining({
        organizationId: 4n,
        deletedAt: null,
        supplierId: { in: [8n] },
        quoteDate: {
          gte: new Date('2026-05-01T00:00:00.000Z'),
          lte: new Date('2026-05-31T00:00:00.000Z'),
        },
        totalAmount: {
          gte: new Prisma.Decimal('100.00'),
          lte: new Prisma.Decimal('2000.00'),
        },
        AND: [
          {
            OR: [
              {
                status: 'received',
                OR: [
                  { validUntil: null },
                  { validUntil: { gte: expect.any(Date) } },
                ],
              },
              { status: 'accepted' },
            ],
          },
          expect.objectContaining({
            OR: expect.arrayContaining([
              { quoteNumber: { contains: 'sq', mode: 'insensitive' } },
            ]),
          }),
        ],
      }),
      orderBy: [{ supplier: { name: 'asc' } }, { id: 'asc' }],
      skip: 0,
      take: 25,
      // Jest asymmetric matchers are typed as any.

      include: expect.any(Object),
    });
  });

  it('excludes expired quotes when filtering for received only', async () => {
    prisma.supplierQuote.findMany.mockResolvedValue([{ id: 1n }]);
    prisma.supplierQuote.count.mockResolvedValue(1);

    await service.findAll(4n, {
      status: ['received'],
    });

    expect(prisma.supplierQuote.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        organizationId: 4n,
        deletedAt: null,
        AND: [
          {
            status: 'received',
            OR: [
              { validUntil: null },
              { validUntil: { gte: expect.any(Date) } },
            ],
          },
        ],
      }),
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: 0,
      take: 10,
      include: expect.any(Object),
    });
  });

  it('sets acceptance audit fields when status changes to accepted', async () => {
    prisma.supplierQuote.findFirst
      .mockResolvedValueOnce({
        id: 1n,
        organizationId: 4n,
        supplierId: 8n,
        attachmentId: null,
        quoteNumber: null,
        status: 'received',
        quoteDate: null,
        validUntil: null,
        currencyCode: 'USD',
        subtotalAmount: new Prisma.Decimal('0'),
        shippingAmount: new Prisma.Decimal('0'),
        taxAmount: new Prisma.Decimal('0'),
        totalAmount: new Prisma.Decimal('0'),
        paymentTerms: null,
        notes: null,
        statusUpdatedAt: null,
        statusUpdatedByUserId: null,
        lines: [],
      })
      .mockResolvedValueOnce(null);
    prisma.supplierQuote.update.mockResolvedValue({ id: 1n });

    await service.update(actor, 1n, { status: 'accepted' });

    expect(prisma.supplierQuote.update).toHaveBeenCalledWith({
      where: { id: 1n },
      // Jest asymmetric matchers are typed as any.

      data: expect.objectContaining({
        status: 'accepted',
        // Jest asymmetric matchers are typed as any.

        statusUpdatedAt: expect.any(Date),
        statusUpdatedByUserId: 9n,
      }),
      // Jest asymmetric matchers are typed as any.

      include: expect.any(Object),
    });
  });

  it('does not delete existing lines when update receives an empty lines array', async () => {
    prisma.supplierQuote.findFirst
      .mockResolvedValueOnce({
        id: 1n,
        organizationId: 4n,
        supplierId: 8n,
        attachmentId: null,
        quoteNumber: 'SQ-1',
        status: 'received',
        quoteDate: null,
        validUntil: null,
        currencyCode: 'USD',
        subtotalAmount: new Prisma.Decimal('100'),
        shippingAmount: new Prisma.Decimal('0'),
        taxAmount: new Prisma.Decimal('0'),
        totalAmount: new Prisma.Decimal('100'),
        paymentTerms: null,
        notes: null,
        statusUpdatedAt: null,
        statusUpdatedByUserId: null,
        lines: [
          {
            id: 10n,
            houseModelId: null,
            productConfigurationId: null,
            description: 'Existing line',
            quantity: 1,
            unitCost: new Prisma.Decimal('100'),
            lineTotal: new Prisma.Decimal('100'),
            estimatedProductionDays: null,
            notes: null,
          },
        ],
      })
      .mockResolvedValueOnce(null);
    prisma.supplierQuote.update.mockResolvedValue({ id: 1n });

    await service.update(actor, 1n, { lines: [] });

    expect(prisma.supplierQuoteLine.deleteMany).not.toHaveBeenCalled();
    expect(prisma.supplierQuote.update).toHaveBeenCalledWith({
      where: { id: 1n },
      data: expect.not.objectContaining({
        lines: expect.anything(),
      }),
      include: expect.any(Object),
    });
  });

  it('cleans up replaced attachments after a successful update', async () => {
    prisma.supplierQuote.findFirst
      .mockResolvedValueOnce({
        id: 1n,
        organizationId: 4n,
        supplierId: 8n,
        attachmentId: 'old_file',
        quoteNumber: 'SQ-1',
        status: 'received',
        quoteDate: null,
        validUntil: null,
        currencyCode: 'USD',
        subtotalAmount: new Prisma.Decimal('100'),
        shippingAmount: new Prisma.Decimal('10'),
        taxAmount: new Prisma.Decimal('5'),
        totalAmount: new Prisma.Decimal('115'),
        paymentTerms: null,
        notes: null,
        statusUpdatedAt: null,
        statusUpdatedByUserId: null,
        attachment: {
          context: 'SUPPLIER_DOCUMENT',
          key: '4/SUPPLIER_DOCUMENT/old_file',
        },
        lines: [],
      })
      .mockResolvedValueOnce(null);
    prisma.fileUpload.findFirst.mockResolvedValueOnce({ id: 'new_file' });
    prisma.supplierQuote.update.mockResolvedValue({
      id: 1n,
      attachmentId: 'new_file',
    });

    await service.update(actor, 1n, { attachmentId: 'new_file' });

    expect(storageService.delete).toHaveBeenCalledWith(
      'SUPPLIER_DOCUMENT',
      '4/SUPPLIER_DOCUMENT/old_file',
    );
    expect(prisma.fileUpload.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'old_file',
        organizationId: 4n,
        status: { not: 'DELETED' },
      },
      data: { status: 'DELETED' },
    });
  });

  it('soft deletes quotes and cleans up linked attachments', async () => {
    prisma.supplierQuote.findFirst.mockResolvedValue({
      id: 1n,
      organizationId: 4n,
      supplierId: 8n,
      attachmentId: 'file_123',
      quoteNumber: 'SQ-1',
      status: 'received',
      quoteDate: null,
      validUntil: null,
      currencyCode: 'USD',
      subtotalAmount: new Prisma.Decimal('100'),
      shippingAmount: new Prisma.Decimal('0'),
      taxAmount: new Prisma.Decimal('0'),
      totalAmount: new Prisma.Decimal('100'),
      paymentTerms: null,
      notes: null,
      statusUpdatedAt: null,
      statusUpdatedByUserId: null,
      attachment: {
        context: 'SUPPLIER_DOCUMENT',
        key: '4/SUPPLIER_DOCUMENT/file_123',
      },
      lines: [],
    });

    await service.remove(4n, 1n);

    expect(prisma.supplierQuote.update).toHaveBeenCalledWith({
      where: { id: 1n },
      data: {
        attachmentId: null,
        deletedAt: expect.any(Date),
      },
    });
    expect(storageService.delete).toHaveBeenCalledWith(
      'SUPPLIER_DOCUMENT',
      '4/SUPPLIER_DOCUMENT/file_123',
    );
  });
});
