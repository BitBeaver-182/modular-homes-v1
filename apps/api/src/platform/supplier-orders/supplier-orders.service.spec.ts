import { BadRequestException, NotFoundException } from '@nestjs/common';
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Prisma } from '@prisma/client';
import { SupplierOrdersService } from './supplier-orders.service';

describe('SupplierOrdersService', () => {
  const prisma = {
    $transaction: jest.fn(),
    invoice: {
      create: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
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
    prisma.supplierOrderLine.create.mockResolvedValue({ id: 1n });
    prisma.supplierOrderLine.update.mockResolvedValue({ id: 1n });
    prisma.supplierOrderLine.deleteMany.mockResolvedValue({ count: 0 });
    service = new SupplierOrdersService(prisma as never);
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
      select: { id: true },
    });
    expect(prisma.supplierOrder.update).toHaveBeenCalledWith({
      where: { id: 101n },
      data: { orderNumber: 'SO-000101' },
      include: expect.any(Object),
    });
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
        organizationId: 4n,
        supplierId: 8n,
        supplierOrderId: 101n,
        invoiceNumber: 'INV-2026-001',
        direction: 'payable',
        invoiceType: 'supplier_goods',
        status: 'issued',
        currencyCode: 'EUR',
        subtotalAmount: new Prisma.Decimal('1000'),
        taxAmount: new Prisma.Decimal('150'),
        totalAmount: new Prisma.Decimal('1150'),
        amountPaid: new Prisma.Decimal('0'),
        balanceDue: new Prisma.Decimal('1150'),
        notes: 'Awaiting remainder',
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
      amountPaid: new Prisma.Decimal('300'),
      balanceDue: new Prisma.Decimal('850'),
      notes: null,
      createdAt: new Date('2026-06-03T00:00:00.000Z'),
      updatedAt: new Date('2026-06-03T00:00:00.000Z'),
    });

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
        amountPaid: new Prisma.Decimal('300'),
        subtotalAmount: new Prisma.Decimal('900'),
        taxAmount: new Prisma.Decimal('135'),
        totalAmount: new Prisma.Decimal('1035'),
        balanceDue: new Prisma.Decimal('735'),
        currencyCode: 'EUR',
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
