import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SupplierQuotesService } from './supplier-quotes.service';

interface PrismaMock {
  $transaction: jest.Mock;
  fileUpload: {
    findFirst: jest.Mock;
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

describe('SupplierQuotesService', () => {
  const prisma: PrismaMock = {
    $transaction: jest.fn(),
    fileUpload: {
      findFirst: jest.fn(),
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
  const storageService = {};
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
      (callback: (client: PrismaMock) => unknown) => callback(prisma),
    );
    prisma.supplier.findFirst.mockResolvedValue({ id: 8n });
    prisma.fileUpload.findFirst.mockResolvedValue(null);
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      include: expect.any(Object),
    });
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
      'sort[field]': 'supplier.name',
      'sort[criteria]': 'asc',
    });

    expect(prisma.supplierQuote.findMany).toHaveBeenCalledWith({
      // Jest asymmetric matchers are typed as any.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
          { status: { in: ['received', 'accepted'] } },
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: expect.objectContaining({
        status: 'accepted',
        // Jest asymmetric matchers are typed as any.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        statusUpdatedAt: expect.any(Date),
        statusUpdatedByUserId: 9n,
      }),
      // Jest asymmetric matchers are typed as any.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      include: expect.any(Object),
    });
  });
});
