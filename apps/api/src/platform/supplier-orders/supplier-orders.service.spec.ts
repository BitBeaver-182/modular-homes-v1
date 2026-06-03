import { BadRequestException, NotFoundException } from '@nestjs/common';
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Prisma } from '@prisma/client';
import { SupplierOrdersService } from './supplier-orders.service';

describe('SupplierOrdersService', () => {
  const storageService = {
    delete: jest.fn(),
    exists: jest.fn(),
    readUrl: jest.fn(),
  };
  const prisma = {
    $transaction: jest.fn(),
    fileUpload: {
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    invoice: {
      create: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    invoiceInstallment: {
      create: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    paymentAllocation: {
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    supplierQuote: {
      findFirst: jest.fn(),
    },
    supplierOrder: {
      create: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    supplierOrderLine: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: SupplierOrdersService;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof prisma) => unknown) => callback(prisma),
    );
    prisma.supplierQuote.findFirst.mockResolvedValue(null);
    prisma.supplierOrder.findFirst.mockResolvedValue(null);
    prisma.supplierOrder.findMany.mockResolvedValue([{ id: 1n }]);
    prisma.supplierOrder.count.mockResolvedValue(1);
    prisma.invoice.create.mockResolvedValue({ id: 1n });
    prisma.invoice.update.mockResolvedValue({ id: 1n });
    prisma.invoice.delete.mockResolvedValue({ id: 1n });
    prisma.invoice.findFirst.mockResolvedValue(null);
    prisma.invoice.findUniqueOrThrow.mockResolvedValue({
      id: 77n,
      totalAmount: new Prisma.Decimal('1150'),
      status: 'issued',
      installments: [],
      paymentAllocations: [],
    });
    prisma.invoiceInstallment.create.mockResolvedValue({ id: 1n });
    prisma.invoiceInstallment.delete.mockResolvedValue({ id: 1n });
    prisma.invoiceInstallment.findFirst.mockResolvedValue(null);
    prisma.invoiceInstallment.findMany.mockResolvedValue([]);
    prisma.invoiceInstallment.update.mockResolvedValue({ id: 1n });
    prisma.payment.create.mockResolvedValue({ id: 1n });
    prisma.payment.delete.mockResolvedValue({ id: 1n });
    prisma.payment.findFirst.mockResolvedValue(null);
    prisma.payment.findUniqueOrThrow.mockResolvedValue({
      id: 1n,
      organizationId: 4n,
      paymentReference: null,
      direction: 'payable',
      status: 'completed',
      paymentMethod: 'bank_transfer',
      paymentDate: new Date('2026-06-05T00:00:00.000Z'),
      currencyCode: 'EUR',
      amount: new Prisma.Decimal('100'),
      bankAccount: null,
      transactionId: null,
      notes: null,
      recordedByUserId: 9n,
      createdAt: new Date('2026-06-05T00:00:00.000Z'),
      updatedAt: new Date('2026-06-05T00:00:00.000Z'),
      allocations: [],
    });
    prisma.payment.update.mockResolvedValue({ id: 1n });
    prisma.paymentAllocation.count.mockResolvedValue(0);
    prisma.paymentAllocation.create.mockResolvedValue({ id: 1n });
    prisma.paymentAllocation.update.mockResolvedValue({ id: 1n });
    prisma.fileUpload.deleteMany.mockResolvedValue({ count: 0 });
    prisma.fileUpload.findFirst.mockResolvedValue(null);
    prisma.fileUpload.updateMany.mockResolvedValue({ count: 1 });
    storageService.delete.mockResolvedValue(undefined);
    storageService.exists.mockResolvedValue(true);
    storageService.readUrl.mockResolvedValue('https://files.test/doc.pdf');
    prisma.supplierOrderLine.create.mockResolvedValue({ id: 1n });
    prisma.supplierOrderLine.update.mockResolvedValue({ id: 1n });
    prisma.supplierOrderLine.deleteMany.mockResolvedValue({ count: 0 });
    service = new SupplierOrdersService(
      prisma as never,
      storageService as never,
    );
  });

  it('creates a draft supplier order from an accepted quote', async () => {
    prisma.supplierQuote.findFirst.mockResolvedValue({
      id: 12n,
      organizationId: 4n,
      supplierId: 8n,
      status: 'accepted',
      validUntil: new Date('2099-06-30T00:00:00.000Z'),
      currencyCode: 'EUR',
      subtotalAmount: new Prisma.Decimal('1000.00'),
      shippingAmount: new Prisma.Decimal('100.00'),
      taxAmount: new Prisma.Decimal('50.00'),
      totalAmount: new Prisma.Decimal('1150.00'),
      paymentTerms: 'Net 30',
      notes: 'Ready to order',
      supplier: null,
      lines: [
        {
          id: 91n,
          organizationId: 4n,
          supplierQuoteId: 12n,
          houseModelId: 15n,
          productConfigurationId: 19n,
          description: 'Model A',
          quantity: 2,
          unitCost: new Prisma.Decimal('500.00'),
          lineTotal: new Prisma.Decimal('1000.00'),
          estimatedProductionDays: null,
          notes: null,
          createdAt: new Date('2026-06-01T00:00:00.000Z'),
          updatedAt: new Date('2026-06-01T00:00:00.000Z'),
        },
      ],
    });
    prisma.supplierOrder.create.mockResolvedValue({ id: 101n });
    prisma.supplierOrder.update.mockResolvedValue({ id: 101n });

    await service.create(
      {
        userId: 9n,
        email: 'buyer@example.com',
        organizationId: 4n,
        governanceRole: 'member',
      },
      { quoteId: '12' },
    );

    expect(prisma.supplierOrder.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 4n,
        supplierId: 8n,
        supplierQuoteId: 12n,
        status: 'draft',
        createdByUserId: 9n,
        currencyCode: 'EUR',
        lines: {
          create: [
            expect.objectContaining({
              organizationId: 4n,
              supplierQuoteLineId: 91n,
              houseModelId: 15n,
              productConfigurationId: 19n,
              description: 'Model A',
              quantity: 2,
            }),
          ],
        },
      }),
      include: expect.any(Object),
    });
    expect(prisma.supplierOrder.update).not.toHaveBeenCalled();
  });

  it('lists supplier orders with safe filters and sorting', async () => {
    await service.findAll(4n, {
      page: 1,
      limit: 25,
      search: 'SO-2026',
      status: ['processing', 'shipped'],
      supplierIds: ['8'],
      createdFrom: '2026-06-01',
      createdTo: '2026-06-30',
      sortField: 'supplier.name',
      sortCriteria: 'asc',
    });

    expect(prisma.supplierOrder.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: 4n,
        AND: [
          {
            status: {
              in: [
                'placed',
                'confirmed',
                'in_production',
                'ready_to_ship',
                'shipped',
              ],
            },
          },
          {
            supplierId: { in: [8n] },
          },
          {
            createdAt: {
              gte: new Date('2026-06-01T00:00:00.000Z'),
              lte: new Date('2026-06-30T23:59:59.999Z'),
            },
          },
          {
            OR: [
              { orderNumber: { contains: 'SO-2026', mode: 'insensitive' } },
              {
                supplierPoNumber: {
                  contains: 'SO-2026',
                  mode: 'insensitive',
                },
              },
            ],
          },
        ],
      },
      orderBy: [{ supplier: { name: 'asc' } }, { id: 'asc' }],
      skip: 0,
      take: 25,
      include: expect.any(Object),
    });
  });

  it('searches by numeric id when given a numeric token', async () => {
    await service.findAll(4n, {
      search: '42',
    });

    expect(prisma.supplierOrder.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: 4n,
        AND: [
          {
            OR: [
              { orderNumber: { contains: '42', mode: 'insensitive' } },
              { supplierPoNumber: { contains: '42', mode: 'insensitive' } },
              { id: 42n },
            ],
          },
        ],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: 0,
      take: 10,
      include: expect.any(Object),
    });
  });

  it('maps delivered filter to arrived and closed persisted statuses', async () => {
    await service.findAll(4n, {
      status: ['delivered'],
    });

    expect(prisma.supplierOrder.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: 4n,
        AND: [
          {
            status: { in: ['arrived', 'closed'] },
          },
        ],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: 0,
      take: 10,
      include: expect.any(Object),
    });
  });

  it('returns a supplier order detail record for the active organization', async () => {
    prisma.supplierOrder.findFirst.mockResolvedValue({
      id: 101n,
      organizationId: 4n,
      supplierId: 8n,
      supplierQuoteId: 12n,
      supplier: null,
      supplierQuote: null,
      lines: [],
      invoices: [],
      status: 'confirmed',
      orderNumber: 'SO-000101',
      supplierPoNumber: 'PO-2026-009',
      orderDate: new Date('2026-06-01T00:00:00.000Z'),
      confirmedAt: null,
      expectedReadyDate: null,
      expectedShipDate: null,
      expectedArrivalDate: null,
      currencyCode: 'EUR',
      subtotalAmount: new Prisma.Decimal('1000.00'),
      shippingAmount: new Prisma.Decimal('100.00'),
      taxAmount: new Prisma.Decimal('50.00'),
      totalAmount: new Prisma.Decimal('1150.00'),
      incoterm: null,
      paymentTerms: null,
      loadingPort: null,
      destinationPort: null,
      notes: null,
      createdByUserId: null,
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      updatedAt: new Date('2026-06-02T00:00:00.000Z'),
    });

    const result = await service.findOne(4n, '101');

    expect(prisma.supplierOrder.findFirst).toHaveBeenCalledWith({
      where: {
        id: 101n,
        organizationId: 4n,
      },
      include: expect.any(Object),
    });
    expect(result.id).toBe(101n);
  });

  it('throws not found when a supplier order detail record is missing', async () => {
    prisma.supplierOrder.findFirst.mockResolvedValue(null);

    await expect(service.findOne(4n, '101')).rejects.toThrow(NotFoundException);
  });

  it('replaces order lines and recalculates order totals', async () => {
    prisma.supplierOrder.findFirst
      .mockResolvedValueOnce({
        id: 101n,
        organizationId: 4n,
        supplierId: 8n,
        supplierQuoteId: null,
        supplier: null,
        supplierQuote: null,
        lines: [
          {
            id: 91n,
            organizationId: 4n,
            supplierOrderId: 101n,
            supplierQuoteLineId: 71n,
            houseModelId: 15n,
            productConfigurationId: 19n,
            description: 'Existing line',
            quantity: 2,
            unitCost: new Prisma.Decimal('500.00'),
            lineTotal: new Prisma.Decimal('1000.00'),
            createdAt: new Date('2026-06-01T00:00:00.000Z'),
          },
        ],
        invoices: [],
        status: 'confirmed',
        orderNumber: 'SO-000101',
        supplierPoNumber: null,
        orderDate: null,
        confirmedAt: null,
        expectedReadyDate: null,
        expectedShipDate: null,
        expectedArrivalDate: null,
        currencyCode: 'EUR',
        subtotalAmount: new Prisma.Decimal('1000.00'),
        shippingAmount: new Prisma.Decimal('100.00'),
        taxAmount: new Prisma.Decimal('50.00'),
        totalAmount: new Prisma.Decimal('1150.00'),
        incoterm: null,
        paymentTerms: null,
        loadingPort: null,
        destinationPort: null,
        notes: null,
        createdByUserId: null,
        createdAt: new Date('2026-06-01T00:00:00.000Z'),
        updatedAt: new Date('2026-06-02T00:00:00.000Z'),
      })
      .mockResolvedValueOnce({
        id: 101n,
        organizationId: 4n,
        shippingAmount: new Prisma.Decimal('100.00'),
        taxAmount: new Prisma.Decimal('50.00'),
        lines: [
          {
            id: 91n,
            organizationId: 4n,
            supplierOrderId: 101n,
            supplierQuoteLineId: 71n,
            houseModelId: 15n,
            productConfigurationId: 19n,
            description: 'Existing line',
            quantity: 2,
            unitCost: new Prisma.Decimal('500.00'),
            lineTotal: new Prisma.Decimal('1000.00'),
            createdAt: new Date('2026-06-01T00:00:00.000Z'),
          },
        ],
      })
      .mockResolvedValueOnce({ id: 101n });

    await service.update(4n, '101', {
      orderLines: [
        {
          id: '91',
          supplierQuoteLineId: '71',
          houseModelId: '15',
          productConfigurationId: '19',
          description: 'Updated line',
          quantity: 3,
          unitCost: 250,
        },
        {
          description: 'New line',
          quantity: 1,
          unitCost: 300,
        },
      ],
    });

    expect(prisma.supplierOrderLine.deleteMany).toHaveBeenCalledWith({
      where: {
        supplierOrderId: 101n,
        id: { notIn: [91n] },
      },
    });
    expect(prisma.supplierOrderLine.update).toHaveBeenCalledWith({
      where: { id: 91n },
      data: expect.objectContaining({
        organizationId: 4n,
        supplierOrderId: 101n,
        description: 'Updated line',
        quantity: 3,
      }),
    });
    expect(prisma.supplierOrderLine.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 4n,
        supplierOrderId: 101n,
        description: 'New line',
        quantity: 1,
      }),
    });
    expect(prisma.supplierOrder.update).toHaveBeenCalledWith({
      where: { id: 101n },
      data: expect.objectContaining({
        subtotalAmount: new Prisma.Decimal('1050'),
        totalAmount: new Prisma.Decimal('1200'),
      }),
      include: expect.any(Object),
    });
  });

  it('rejects updates for line ids outside the active order', async () => {
    prisma.supplierOrder.findFirst
      .mockResolvedValueOnce({
        id: 101n,
        organizationId: 4n,
        supplierId: 8n,
        supplierQuoteId: null,
        supplier: null,
        supplierQuote: null,
        lines: [],
        invoices: [],
        status: 'confirmed',
        orderNumber: 'SO-000101',
        supplierPoNumber: null,
        orderDate: null,
        confirmedAt: null,
        expectedReadyDate: null,
        expectedShipDate: null,
        expectedArrivalDate: null,
        currencyCode: 'EUR',
        subtotalAmount: new Prisma.Decimal('0'),
        shippingAmount: new Prisma.Decimal('0'),
        taxAmount: new Prisma.Decimal('0'),
        totalAmount: new Prisma.Decimal('0'),
        incoterm: null,
        paymentTerms: null,
        loadingPort: null,
        destinationPort: null,
        notes: null,
        createdByUserId: null,
        createdAt: new Date('2026-06-01T00:00:00.000Z'),
        updatedAt: new Date('2026-06-02T00:00:00.000Z'),
      })
      .mockResolvedValueOnce({
        id: 101n,
        organizationId: 4n,
        shippingAmount: new Prisma.Decimal('0'),
        taxAmount: new Prisma.Decimal('0'),
        lines: [],
      });

    await expect(
      service.update(4n, '101', {
        orderLines: [
          {
            id: '999',
            description: 'Nope',
            quantity: 1,
            unitCost: 100,
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects updates for supplier orders in terminal statuses', async () => {
    prisma.supplierOrder.findFirst.mockResolvedValue({
      id: 101n,
      organizationId: 4n,
      supplierId: 8n,
      supplierQuoteId: null,
      supplier: null,
      supplierQuote: null,
      lines: [],
      invoices: [],
      status: 'closed',
      orderNumber: 'SO-000101',
      supplierPoNumber: null,
      orderDate: null,
      confirmedAt: null,
      expectedReadyDate: null,
      expectedShipDate: null,
      expectedArrivalDate: null,
      currencyCode: 'EUR',
      subtotalAmount: new Prisma.Decimal('0'),
      shippingAmount: new Prisma.Decimal('0'),
      taxAmount: new Prisma.Decimal('0'),
      totalAmount: new Prisma.Decimal('0'),
      incoterm: null,
      paymentTerms: null,
      loadingPort: null,
      destinationPort: null,
      notes: null,
      createdByUserId: null,
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      updatedAt: new Date('2026-06-02T00:00:00.000Z'),
    });

    await expect(
      service.update(4n, '101', {
        orderLines: [
          {
            description: 'Locked line',
            quantity: 1,
            unitCost: 100,
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects attempts to change persisted line references', async () => {
    prisma.supplierOrder.findFirst
      .mockResolvedValueOnce({
        id: 101n,
        organizationId: 4n,
        supplierId: 8n,
        supplierQuoteId: null,
        supplier: null,
        supplierQuote: null,
        lines: [
          {
            id: 91n,
            organizationId: 4n,
            supplierOrderId: 101n,
            supplierQuoteLineId: 71n,
            houseModelId: 15n,
            productConfigurationId: 19n,
            description: 'Existing line',
            quantity: 2,
            unitCost: new Prisma.Decimal('500.00'),
            lineTotal: new Prisma.Decimal('1000.00'),
            createdAt: new Date('2026-06-01T00:00:00.000Z'),
          },
        ],
        invoices: [],
        status: 'confirmed',
        orderNumber: 'SO-000101',
        supplierPoNumber: null,
        orderDate: null,
        confirmedAt: null,
        expectedReadyDate: null,
        expectedShipDate: null,
        expectedArrivalDate: null,
        currencyCode: 'EUR',
        subtotalAmount: new Prisma.Decimal('1000'),
        shippingAmount: new Prisma.Decimal('0'),
        taxAmount: new Prisma.Decimal('0'),
        totalAmount: new Prisma.Decimal('1000'),
        incoterm: null,
        paymentTerms: null,
        loadingPort: null,
        destinationPort: null,
        notes: null,
        createdByUserId: null,
        createdAt: new Date('2026-06-01T00:00:00.000Z'),
        updatedAt: new Date('2026-06-02T00:00:00.000Z'),
      })
      .mockResolvedValueOnce({
        id: 101n,
        organizationId: 4n,
        shippingAmount: new Prisma.Decimal('0'),
        taxAmount: new Prisma.Decimal('0'),
        lines: [
          {
            id: 91n,
            organizationId: 4n,
            supplierOrderId: 101n,
            supplierQuoteLineId: 71n,
            houseModelId: 15n,
            productConfigurationId: 19n,
            description: 'Existing line',
            quantity: 2,
            unitCost: new Prisma.Decimal('500.00'),
            lineTotal: new Prisma.Decimal('1000.00'),
            createdAt: new Date('2026-06-01T00:00:00.000Z'),
          },
        ],
      });

    await expect(
      service.update(4n, '101', {
        orderLines: [
          {
            id: '91',
            supplierQuoteLineId: '999',
            houseModelId: '15',
            productConfigurationId: '19',
            description: 'Updated line',
            quantity: 2,
            unitCost: 500,
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects new lines that try to set linked references', async () => {
    prisma.supplierOrder.findFirst
      .mockResolvedValueOnce({
        id: 101n,
        organizationId: 4n,
        supplierId: 8n,
        supplierQuoteId: null,
        supplier: null,
        supplierQuote: null,
        lines: [],
        invoices: [],
        status: 'confirmed',
        orderNumber: 'SO-000101',
        supplierPoNumber: null,
        orderDate: null,
        confirmedAt: null,
        expectedReadyDate: null,
        expectedShipDate: null,
        expectedArrivalDate: null,
        currencyCode: 'EUR',
        subtotalAmount: new Prisma.Decimal('0'),
        shippingAmount: new Prisma.Decimal('0'),
        taxAmount: new Prisma.Decimal('0'),
        totalAmount: new Prisma.Decimal('0'),
        incoterm: null,
        paymentTerms: null,
        loadingPort: null,
        destinationPort: null,
        notes: null,
        createdByUserId: null,
        createdAt: new Date('2026-06-01T00:00:00.000Z'),
        updatedAt: new Date('2026-06-02T00:00:00.000Z'),
      })
      .mockResolvedValueOnce({
        id: 101n,
        organizationId: 4n,
        shippingAmount: new Prisma.Decimal('0'),
        taxAmount: new Prisma.Decimal('0'),
        lines: [],
      });

    await expect(
      service.update(4n, '101', {
        orderLines: [
          {
            supplierQuoteLineId: '71',
            description: 'Linked line',
            quantity: 1,
            unitCost: 100,
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates a supplier-order invoice with derived totals and payable direction', async () => {
    prisma.supplierOrder.findFirst.mockResolvedValue({
      id: 101n,
      organizationId: 4n,
      supplierId: 8n,
      supplierQuoteId: null,
      supplier: null,
      supplierQuote: null,
      lines: [],
      invoices: [],
      status: 'confirmed',
      orderNumber: 'SO-000101',
      supplierPoNumber: null,
      orderDate: null,
      confirmedAt: null,
      expectedReadyDate: null,
      expectedShipDate: null,
      expectedArrivalDate: null,
      currencyCode: 'EUR',
      subtotalAmount: new Prisma.Decimal('0'),
      shippingAmount: new Prisma.Decimal('0'),
      taxAmount: new Prisma.Decimal('0'),
      totalAmount: new Prisma.Decimal('0'),
      incoterm: null,
      paymentTerms: null,
      loadingPort: null,
      destinationPort: null,
      notes: null,
      createdByUserId: null,
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      updatedAt: new Date('2026-06-02T00:00:00.000Z'),
    });
    prisma.invoice.create.mockResolvedValue({
      attachment: null,
      id: 77n,
      organizationId: 4n,
      invoiceNumber: 'INV-2026-001',
      direction: 'payable',
      invoiceType: 'supplier_goods',
      status: 'issued',
      supplierId: 8n,
      supplierOrderId: 101n,
      issueDate: new Date('2026-06-03T00:00:00.000Z'),
      dueDate: new Date('2026-06-30T00:00:00.000Z'),
      currencyCode: 'EUR',
      exchangeRateToBase: null,
      subtotalAmount: new Prisma.Decimal('1000'),
      taxAmount: new Prisma.Decimal('150'),
      totalAmount: new Prisma.Decimal('1150'),
      amountPaid: new Prisma.Decimal('0'),
      balanceDue: new Prisma.Decimal('1150'),
      notes: 'Awaiting remainder',
      createdAt: new Date('2026-06-03T00:00:00.000Z'),
      updatedAt: new Date('2026-06-03T00:00:00.000Z'),
    });

    await service.createInvoice(4n, '101', {
      invoiceNumber: 'INV-2026-001',
      invoiceType: 'supplier_goods',
      status: 'issued',
      issueDate: '2026-06-03',
      dueDate: '2026-06-30',
      subtotalAmount: 1000,
      taxAmount: 150,
      notes: 'Awaiting remainder',
    });

    expect(prisma.invoice.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        attachmentId: null,
        organizationId: 4n,
        supplierId: 8n,
        supplierOrderId: 101n,
        invoiceNumber: 'INV-2026-001',
        direction: 'payable',
        invoiceType: 'supplier_goods',
        status: 'issued',
        issueDate: new Date('2026-06-03T00:00:00.000Z'),
        dueDate: new Date('2026-06-30T00:00:00.000Z'),
        currencyCode: 'EUR',
        subtotalAmount: new Prisma.Decimal('1000'),
        taxAmount: new Prisma.Decimal('150'),
        totalAmount: new Prisma.Decimal('1150'),
        amountPaid: new Prisma.Decimal('0'),
        balanceDue: new Prisma.Decimal('1150'),
        notes: 'Awaiting remainder',
      }),
      include: expect.objectContaining({
        attachment: true,
        installments: expect.any(Object),
        paymentAllocations: expect.any(Object),
      }),
    });
  });

  it('updates a supplier-order invoice and preserves amount paid', async () => {
    prisma.supplierOrder.findFirst.mockResolvedValue({
      id: 101n,
      organizationId: 4n,
      supplierId: 8n,
      supplierQuoteId: null,
      supplier: null,
      supplierQuote: null,
      lines: [],
      invoices: [],
      status: 'confirmed',
      orderNumber: 'SO-000101',
      supplierPoNumber: null,
      orderDate: null,
      confirmedAt: null,
      expectedReadyDate: null,
      expectedShipDate: null,
      expectedArrivalDate: null,
      currencyCode: 'EUR',
      subtotalAmount: new Prisma.Decimal('0'),
      shippingAmount: new Prisma.Decimal('0'),
      taxAmount: new Prisma.Decimal('0'),
      totalAmount: new Prisma.Decimal('0'),
      incoterm: null,
      paymentTerms: null,
      loadingPort: null,
      destinationPort: null,
      notes: null,
      createdByUserId: null,
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      updatedAt: new Date('2026-06-02T00:00:00.000Z'),
    });
    prisma.invoice.findFirst
      .mockResolvedValueOnce({
        id: 77n,
        organizationId: 4n,
        attachmentId: null,
        attachment: null,
        invoiceNumber: 'INV-2026-001',
        direction: 'payable',
        invoiceType: 'supplier_goods',
        status: 'issued',
        supplierId: 8n,
        supplierOrderId: 101n,
        issueDate: null,
        dueDate: null,
        currencyCode: 'EUR',
        exchangeRateToBase: null,
        subtotalAmount: new Prisma.Decimal('1000'),
        taxAmount: new Prisma.Decimal('150'),
        totalAmount: new Prisma.Decimal('1150'),
        amountPaid: new Prisma.Decimal('300'),
        balanceDue: new Prisma.Decimal('850'),
        notes: null,
        createdAt: new Date('2026-06-03T00:00:00.000Z'),
        updatedAt: new Date('2026-06-03T00:00:00.000Z'),
      })
      .mockResolvedValueOnce(null);

    await service.updateInvoice(4n, '101', '77', {
      invoiceNumber: 'INV-2026-001',
      invoiceType: 'supplier_goods',
      status: 'partially_paid',
      issueDate: '2026-06-03',
      dueDate: '2026-06-30',
      subtotalAmount: 900,
      taxAmount: 135,
      notes: 'Revised invoice',
    });

    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: { id: 77n },
      data: expect.objectContaining({
        supplierId: 8n,
        invoiceNumber: 'INV-2026-001',
        direction: 'payable',
        invoiceType: 'supplier_goods',
        status: 'partially_paid',
        issueDate: new Date('2026-06-03T00:00:00.000Z'),
        dueDate: new Date('2026-06-30T00:00:00.000Z'),
        notes: 'Revised invoice',
        amountPaid: new Prisma.Decimal('300'),
        subtotalAmount: new Prisma.Decimal('900'),
        taxAmount: new Prisma.Decimal('135'),
        totalAmount: new Prisma.Decimal('1035'),
        balanceDue: new Prisma.Decimal('735'),
        currencyCode: 'EUR',
      }),
      include: expect.objectContaining({
        attachment: true,
        installments: expect.any(Object),
        paymentAllocations: expect.any(Object),
      }),
    });
  });

  it('claims a pending upload when creating a supplier-order invoice', async () => {
    prisma.supplierOrder.findFirst.mockResolvedValue({
      id: 101n,
      organizationId: 4n,
      supplierId: 8n,
      supplierQuoteId: null,
      supplier: null,
      supplierQuote: null,
      lines: [],
      invoices: [],
      status: 'confirmed',
      orderNumber: 'SO-000101',
      supplierPoNumber: null,
      orderDate: null,
      confirmedAt: null,
      expectedReadyDate: null,
      expectedShipDate: null,
      expectedArrivalDate: null,
      currencyCode: 'EUR',
      subtotalAmount: new Prisma.Decimal('0'),
      shippingAmount: new Prisma.Decimal('0'),
      taxAmount: new Prisma.Decimal('0'),
      totalAmount: new Prisma.Decimal('0'),
      incoterm: null,
      paymentTerms: null,
      loadingPort: null,
      destinationPort: null,
      notes: null,
      createdByUserId: null,
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      updatedAt: new Date('2026-06-02T00:00:00.000Z'),
    });
    prisma.fileUpload.findFirst.mockResolvedValue({
      id: 'file_123',
      status: 'PENDING',
      expiresAt: new Date('2099-06-30T00:00:00.000Z'),
      key: '4/SUPPLIER_DOCUMENT/file_123',
      context: 'SUPPLIER_DOCUMENT',
    });

    await service.createInvoice(4n, '101', {
      attachmentId: 'file_123',
      invoiceNumber: 'INV-2026-005',
      invoiceType: 'supplier_goods',
      status: 'issued',
      issueDate: '2026-06-03',
      dueDate: '2026-06-30',
      subtotalAmount: 1000,
      taxAmount: 150,
      notes: null,
    });

    expect(storageService.exists).toHaveBeenCalledWith(
      'SUPPLIER_DOCUMENT',
      '4/SUPPLIER_DOCUMENT/file_123',
    );
    expect(prisma.fileUpload.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'file_123',
        organizationId: 4n,
        context: 'SUPPLIER_DOCUMENT',
        status: { in: ['PENDING', 'CONFIRMED'] },
        expiresAt: { not: null },
      },
      data: {
        status: 'CONFIRMED',
        confirmedAt: expect.any(Date),
        expiresAt: null,
      },
    });
    expect(prisma.invoice.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        attachmentId: 'file_123',
      }),
      include: expect.objectContaining({
        attachment: true,
        installments: expect.any(Object),
        paymentAllocations: expect.any(Object),
      }),
    });
  });

  it('rejects invoice updates when the invoice does not belong to the parent order', async () => {
    prisma.supplierOrder.findFirst.mockResolvedValue({
      id: 101n,
      organizationId: 4n,
      supplierId: 8n,
      supplierQuoteId: null,
      supplier: null,
      supplierQuote: null,
      lines: [],
      invoices: [],
      status: 'confirmed',
      orderNumber: 'SO-000101',
      supplierPoNumber: null,
      orderDate: null,
      confirmedAt: null,
      expectedReadyDate: null,
      expectedShipDate: null,
      expectedArrivalDate: null,
      currencyCode: 'EUR',
      subtotalAmount: new Prisma.Decimal('0'),
      shippingAmount: new Prisma.Decimal('0'),
      taxAmount: new Prisma.Decimal('0'),
      totalAmount: new Prisma.Decimal('0'),
      incoterm: null,
      paymentTerms: null,
      loadingPort: null,
      destinationPort: null,
      notes: null,
      createdByUserId: null,
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      updatedAt: new Date('2026-06-02T00:00:00.000Z'),
    });
    prisma.invoice.findFirst.mockResolvedValue(null);

    await expect(
      service.updateInvoice(4n, '101', '77', {
        invoiceNumber: 'INV-2026-001',
        invoiceType: 'supplier_goods',
        status: 'issued',
        issueDate: '2026-06-03',
        dueDate: '2026-06-30',
        subtotalAmount: 1000,
        taxAmount: 150,
        notes: null,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('creates an invoice installment with the next sequential number', async () => {
    prisma.supplierOrder.findFirst.mockResolvedValue({
      id: 101n,
      organizationId: 4n,
      supplierId: 8n,
      supplierQuoteId: null,
      supplier: null,
      supplierQuote: null,
      lines: [],
      invoices: [],
      status: 'confirmed',
      orderNumber: 'SO-000101',
      supplierPoNumber: null,
      orderDate: null,
      confirmedAt: null,
      expectedReadyDate: null,
      expectedShipDate: null,
      expectedArrivalDate: null,
      currencyCode: 'EUR',
      subtotalAmount: new Prisma.Decimal('0'),
      shippingAmount: new Prisma.Decimal('0'),
      taxAmount: new Prisma.Decimal('0'),
      totalAmount: new Prisma.Decimal('0'),
      incoterm: null,
      paymentTerms: null,
      loadingPort: null,
      destinationPort: null,
      notes: null,
      createdByUserId: null,
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      updatedAt: new Date('2026-06-02T00:00:00.000Z'),
    });
    prisma.invoice.findFirst.mockResolvedValue({
      id: 77n,
      organizationId: 4n,
      attachmentId: null,
      attachment: null,
      installments: [],
      paymentAllocations: [],
      invoiceNumber: 'INV-2026-001',
      direction: 'payable',
      invoiceType: 'supplier_goods',
      status: 'issued',
      supplierId: 8n,
      supplierOrderId: 101n,
      issueDate: null,
      dueDate: null,
      currencyCode: 'EUR',
      exchangeRateToBase: null,
      subtotalAmount: new Prisma.Decimal('1000'),
      taxAmount: new Prisma.Decimal('150'),
      totalAmount: new Prisma.Decimal('1150'),
      amountPaid: new Prisma.Decimal('0'),
      balanceDue: new Prisma.Decimal('1150'),
      notes: null,
      createdAt: new Date('2026-06-03T00:00:00.000Z'),
      updatedAt: new Date('2026-06-03T00:00:00.000Z'),
    });
    prisma.invoiceInstallment.findFirst.mockResolvedValue({
      installmentNumber: 1,
    });
    prisma.invoiceInstallment.create.mockResolvedValue({
      id: 19n,
      organizationId: 4n,
      invoiceId: 77n,
      installmentNumber: 2,
      status: 'scheduled',
      dueDate: new Date('2026-07-01T00:00:00.000Z'),
      amountDue: new Prisma.Decimal('500'),
      amountPaid: new Prisma.Decimal('0'),
      paidAt: null,
      notes: 'Second installment',
      createdAt: new Date('2026-06-03T00:00:00.000Z'),
      updatedAt: new Date('2026-06-03T00:00:00.000Z'),
    });
    prisma.invoice.findUniqueOrThrow.mockResolvedValue({
      id: 77n,
      totalAmount: new Prisma.Decimal('1150'),
      status: 'issued',
      installments: [
        {
          id: 19n,
          installmentNumber: 2,
          status: 'scheduled',
          dueDate: new Date('2026-07-01T00:00:00.000Z'),
          amountDue: new Prisma.Decimal('500'),
          amountPaid: new Prisma.Decimal('0'),
          paidAt: null,
          notes: 'Second installment',
          createdAt: new Date('2026-06-03T00:00:00.000Z'),
          updatedAt: new Date('2026-06-03T00:00:00.000Z'),
          organizationId: 4n,
          invoiceId: 77n,
        },
      ],
      paymentAllocations: [],
    });
    prisma.invoiceInstallment.findMany.mockResolvedValue([
      {
        id: 19n,
        installmentNumber: 2,
        status: 'scheduled',
        dueDate: new Date('2026-07-01T00:00:00.000Z'),
        amountDue: new Prisma.Decimal('500'),
        amountPaid: new Prisma.Decimal('0'),
        paidAt: null,
        notes: 'Second installment',
        createdAt: new Date('2026-06-03T00:00:00.000Z'),
        updatedAt: new Date('2026-06-03T00:00:00.000Z'),
        organizationId: 4n,
        invoiceId: 77n,
      },
    ]);

    await service.createInstallment(4n, '101', '77', {
      dueDate: '2026-07-01',
      amountDue: 500,
      notes: 'Second installment',
    });

    expect(prisma.invoiceInstallment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 4n,
        invoiceId: 77n,
        installmentNumber: 2,
        amountDue: new Prisma.Decimal('500'),
        notes: 'Second installment',
      }),
    });
  });

  it('records a payment allocated to a selected installment', async () => {
    prisma.supplierOrder.findFirst.mockResolvedValue({
      id: 101n,
      organizationId: 4n,
      supplierId: 8n,
      supplierQuoteId: null,
      supplier: null,
      supplierQuote: null,
      lines: [],
      invoices: [],
      status: 'confirmed',
      orderNumber: 'SO-000101',
      supplierPoNumber: null,
      orderDate: null,
      confirmedAt: null,
      expectedReadyDate: null,
      expectedShipDate: null,
      expectedArrivalDate: null,
      currencyCode: 'EUR',
      subtotalAmount: new Prisma.Decimal('0'),
      shippingAmount: new Prisma.Decimal('0'),
      taxAmount: new Prisma.Decimal('0'),
      totalAmount: new Prisma.Decimal('0'),
      incoterm: null,
      paymentTerms: null,
      loadingPort: null,
      destinationPort: null,
      notes: null,
      createdByUserId: null,
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      updatedAt: new Date('2026-06-02T00:00:00.000Z'),
    });
    prisma.invoice.findFirst.mockResolvedValue({
      id: 77n,
      organizationId: 4n,
      attachmentId: null,
      attachment: null,
      installments: [],
      paymentAllocations: [],
      invoiceNumber: 'INV-2026-001',
      direction: 'payable',
      invoiceType: 'supplier_goods',
      status: 'issued',
      supplierId: 8n,
      supplierOrderId: 101n,
      issueDate: null,
      dueDate: null,
      currencyCode: 'EUR',
      exchangeRateToBase: null,
      subtotalAmount: new Prisma.Decimal('1000'),
      taxAmount: new Prisma.Decimal('150'),
      totalAmount: new Prisma.Decimal('1150'),
      amountPaid: new Prisma.Decimal('300'),
      balanceDue: new Prisma.Decimal('850'),
      notes: null,
      createdAt: new Date('2026-06-03T00:00:00.000Z'),
      updatedAt: new Date('2026-06-03T00:00:00.000Z'),
    });
    prisma.invoiceInstallment.findFirst.mockResolvedValue({
      id: 19n,
      organizationId: 4n,
      invoiceId: 77n,
      installmentNumber: 1,
      status: 'partially_paid',
      dueDate: new Date('2026-06-15T00:00:00.000Z'),
      amountDue: new Prisma.Decimal('500'),
      amountPaid: new Prisma.Decimal('300'),
      paidAt: null,
      notes: 'Deposit',
      createdAt: new Date('2026-06-03T00:00:00.000Z'),
      updatedAt: new Date('2026-06-03T00:00:00.000Z'),
    });
    prisma.payment.create.mockResolvedValue({ id: 201n });
    prisma.payment.findUniqueOrThrow.mockResolvedValue({
      id: 201n,
      organizationId: 4n,
      paymentReference: 'PAY-2026-0002',
      direction: 'payable',
      status: 'completed',
      paymentMethod: 'bank_transfer',
      paymentDate: new Date('2026-06-05T00:00:00.000Z'),
      currencyCode: 'EUR',
      amount: new Prisma.Decimal('200'),
      bankAccount: null,
      transactionId: null,
      notes: 'Second deposit tranche',
      recordedByUserId: 9n,
      createdAt: new Date('2026-06-05T00:00:00.000Z'),
      updatedAt: new Date('2026-06-05T00:00:00.000Z'),
      allocations: [
        {
          id: 31n,
          organizationId: 4n,
          allocationReference: 'ALLOC-000201',
          paymentId: 201n,
          invoiceId: 77n,
          invoiceInstallmentId: 19n,
          allocatedAmount: new Prisma.Decimal('200'),
          createdAt: new Date('2026-06-05T00:00:00.000Z'),
        },
      ],
    });
    prisma.invoice.findUniqueOrThrow.mockResolvedValue({
      id: 77n,
      totalAmount: new Prisma.Decimal('1150'),
      status: 'issued',
      installments: [
        {
          id: 19n,
          organizationId: 4n,
          invoiceId: 77n,
          installmentNumber: 1,
          status: 'partially_paid',
          dueDate: new Date('2026-06-15T00:00:00.000Z'),
          amountDue: new Prisma.Decimal('500'),
          amountPaid: new Prisma.Decimal('300'),
          paidAt: null,
          notes: 'Deposit',
          createdAt: new Date('2026-06-03T00:00:00.000Z'),
          updatedAt: new Date('2026-06-03T00:00:00.000Z'),
        },
      ],
      paymentAllocations: [
        {
          id: 31n,
          organizationId: 4n,
          allocationReference: 'ALLOC-000201',
          paymentId: 201n,
          invoiceId: 77n,
          invoiceInstallmentId: 19n,
          allocatedAmount: new Prisma.Decimal('200'),
          createdAt: new Date('2026-06-05T00:00:00.000Z'),
        },
      ],
    });

    await service.createPayment(
      {
        userId: 9n,
        email: 'buyer@example.com',
        organizationId: 4n,
        governanceRole: 'member',
      },
      4n,
      '101',
      '77',
      {
        paymentReference: 'PAY-2026-0002',
        paymentMethod: 'bank_transfer',
        paymentDate: '2026-06-05',
        amount: 200,
        notes: 'Second deposit tranche',
        invoiceInstallmentId: '19',
      },
    );

    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 4n,
        paymentReference: 'PAY-2026-0002',
        direction: 'payable',
        status: 'completed',
        paymentMethod: 'bank_transfer',
        currencyCode: 'EUR',
        amount: new Prisma.Decimal('200'),
        notes: 'Second deposit tranche',
        recordedByUserId: 9n,
      }),
    });
    expect(prisma.paymentAllocation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 4n,
        paymentId: 201n,
        invoiceId: 77n,
        invoiceInstallmentId: 19n,
        allocatedAmount: new Prisma.Decimal('200'),
      }),
    });
  });

  it('rejects invoice overpayments with an amount field validation path', async () => {
    prisma.supplierOrder.findFirst.mockResolvedValue({
      id: 101n,
      organizationId: 4n,
      supplierId: 8n,
      supplierQuoteId: null,
      supplier: null,
      supplierQuote: null,
      lines: [],
      invoices: [],
      status: 'confirmed',
      orderNumber: 'SO-000101',
      supplierPoNumber: null,
      orderDate: null,
      confirmedAt: null,
      expectedReadyDate: null,
      expectedShipDate: null,
      expectedArrivalDate: null,
      currencyCode: 'EUR',
      subtotalAmount: new Prisma.Decimal('0'),
      shippingAmount: new Prisma.Decimal('0'),
      taxAmount: new Prisma.Decimal('0'),
      totalAmount: new Prisma.Decimal('0'),
      incoterm: null,
      paymentTerms: null,
      loadingPort: null,
      destinationPort: null,
      notes: null,
      createdByUserId: null,
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      updatedAt: new Date('2026-06-02T00:00:00.000Z'),
    });
    prisma.invoice.findFirst.mockResolvedValue({
      id: 77n,
      organizationId: 4n,
      attachmentId: null,
      attachment: null,
      installments: [],
      paymentAllocations: [],
      invoiceNumber: 'INV-2026-001',
      direction: 'payable',
      invoiceType: 'supplier_goods',
      status: 'issued',
      supplierId: 8n,
      supplierOrderId: 101n,
      issueDate: null,
      dueDate: null,
      currencyCode: 'EUR',
      exchangeRateToBase: null,
      subtotalAmount: new Prisma.Decimal('1000'),
      taxAmount: new Prisma.Decimal('150'),
      totalAmount: new Prisma.Decimal('1150'),
      amountPaid: new Prisma.Decimal('1000'),
      balanceDue: new Prisma.Decimal('150'),
      notes: null,
      createdAt: new Date('2026-06-03T00:00:00.000Z'),
      updatedAt: new Date('2026-06-03T00:00:00.000Z'),
    });

    await expect(
      service.createPayment(
        {
          userId: 9n,
          email: 'buyer@example.com',
          organizationId: 4n,
          governanceRole: 'member',
        },
        4n,
        '101',
        '77',
        {
          paymentReference: null,
          paymentMethod: 'bank_transfer',
          paymentDate: '2026-06-05',
          amount: 200,
          notes: null,
          invoiceInstallmentId: null,
        },
      ),
    ).rejects.toMatchObject({
      response: {
        message: 'Payment amount cannot exceed the invoice balance due',
        errors: [
          expect.objectContaining({
            path: ['amount'],
            key: 'validation.max',
          }),
        ],
      },
    });

    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('deletes a supplier-order invoice scoped to the parent order', async () => {
    prisma.supplierOrder.findFirst.mockResolvedValue({
      id: 101n,
      organizationId: 4n,
      supplierId: 8n,
      supplierQuoteId: null,
      supplier: null,
      supplierQuote: null,
      lines: [],
      invoices: [],
      status: 'confirmed',
      orderNumber: 'SO-000101',
      supplierPoNumber: null,
      orderDate: null,
      confirmedAt: null,
      expectedReadyDate: null,
      expectedShipDate: null,
      expectedArrivalDate: null,
      currencyCode: 'EUR',
      subtotalAmount: new Prisma.Decimal('0'),
      shippingAmount: new Prisma.Decimal('0'),
      taxAmount: new Prisma.Decimal('0'),
      totalAmount: new Prisma.Decimal('0'),
      incoterm: null,
      paymentTerms: null,
      loadingPort: null,
      destinationPort: null,
      notes: null,
      createdByUserId: null,
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      updatedAt: new Date('2026-06-02T00:00:00.000Z'),
    });
    prisma.invoice.findFirst.mockResolvedValue({
      id: 77n,
      organizationId: 4n,
      invoiceNumber: 'INV-2026-001',
      direction: 'payable',
      invoiceType: 'supplier_goods',
      status: 'issued',
      supplierId: 8n,
      supplierOrderId: 101n,
      issueDate: null,
      dueDate: null,
      currencyCode: 'EUR',
      exchangeRateToBase: null,
      subtotalAmount: new Prisma.Decimal('1000'),
      taxAmount: new Prisma.Decimal('150'),
      totalAmount: new Prisma.Decimal('1150'),
      amountPaid: new Prisma.Decimal('0'),
      balanceDue: new Prisma.Decimal('1150'),
      notes: null,
      createdAt: new Date('2026-06-03T00:00:00.000Z'),
      updatedAt: new Date('2026-06-03T00:00:00.000Z'),
    });

    await service.deleteInvoice(4n, '101', '77');

    expect(prisma.invoice.delete).toHaveBeenCalledWith({
      where: { id: 77n },
    });
  });
});
