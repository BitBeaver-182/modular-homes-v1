import { Prisma } from '@prisma/client';
import {
  type SupplierOrderWithRelations,
  toSupplierOrderDetailResponse,
  toSupplierOrderListItemResponse,
} from './supplier-order.mapper';

describe('supplier-order mapper', () => {
  const storageService = {
    readUrl: jest.fn().mockResolvedValue('https://files.test/doc.pdf'),
  };
  const supplierOrderRecord: SupplierOrderWithRelations = {
    id: 101n,
    organizationId: 4n,
    supplierId: 8n,
    supplierQuoteId: 12n,
    supplier: {
      id: 8n,
      organizationId: 4n,
      addressId: null,
      name: 'Acme Supply',
      phoneNumber: null,
      email: 'ops@acme.test',
      address: null,
      website: null,
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      updatedAt: new Date('2026-06-01T00:00:00.000Z'),
      deletedAt: null,
    },
    supplierQuote: {
      id: 12n,
      organizationId: 4n,
      supplierId: 8n,
      attachmentId: null,
      status: 'accepted',
      supplier: {
        id: 8n,
        organizationId: 4n,
        addressId: null,
        name: 'Acme Supply',
        phoneNumber: null,
        email: 'ops@acme.test',
        address: null,
        website: null,
        createdAt: new Date('2026-06-01T00:00:00.000Z'),
        updatedAt: new Date('2026-06-01T00:00:00.000Z'),
        deletedAt: null,
      },
      quoteNumber: 'Q-2026-001',
      quoteDate: new Date('2026-05-20T00:00:00.000Z'),
      validUntil: new Date('2026-06-20T00:00:00.000Z'),
      subtotalAmount: new Prisma.Decimal('1000.00'),
      shippingAmount: new Prisma.Decimal('100.00'),
      taxAmount: new Prisma.Decimal('50.00'),
      paymentTerms: 'Net 30',
      notes: null,
      statusUpdatedAt: null,
      statusUpdatedByUserId: null,
      deletedAt: null,
      createdAt: new Date('2026-05-20T00:00:00.000Z'),
      updatedAt: new Date('2026-05-20T00:00:00.000Z'),
      currencyCode: 'EUR',
      totalAmount: new Prisma.Decimal('1150.00'),
    },
    lines: [
      {
        id: 91n,
        supplierOrderId: 101n,
        organizationId: 4n,
        supplierQuoteLineId: 71n,
        houseModelId: 15n,
        productConfigurationId: 19n,
        description: 'Model A',
        quantity: 2,
        unitCost: new Prisma.Decimal('500.00'),
        lineTotal: new Prisma.Decimal('1000.00'),
        createdAt: new Date('2026-06-01T00:00:00.000Z'),
      },
    ],
    invoices: [
      {
        attachment: null,
        attachmentId: null,
        installments: [
          {
            id: 19n,
            organizationId: 4n,
            invoiceId: 77n,
            installmentNumber: 1,
            status: 'partially_paid' as const,
            dueDate: new Date('2026-06-15T00:00:00.000Z'),
            amountDue: new Prisma.Decimal('500.00'),
            amountPaid: new Prisma.Decimal('300.00'),
            paidAt: null,
            notes: 'Deposit',
            createdAt: new Date('2026-06-03T00:00:00.000Z'),
            updatedAt: new Date('2026-06-04T00:00:00.000Z'),
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
            allocatedAmount: new Prisma.Decimal('300.00'),
            createdAt: new Date('2026-06-04T00:00:00.000Z'),
            payment: {
              id: 201n,
              organizationId: 4n,
              paymentReference: 'PAY-2026-0001',
              direction: 'payable' as const,
              status: 'completed' as const,
              paymentMethod: 'bank_transfer' as const,
              paymentDate: new Date('2026-06-04T00:00:00.000Z'),
              currencyCode: 'EUR',
              amount: new Prisma.Decimal('300.00'),
              bankAccount: null,
              transactionId: null,
              notes: 'Deposit paid',
              recordedByUserId: 9n,
              createdAt: new Date('2026-06-04T00:00:00.000Z'),
              updatedAt: new Date('2026-06-04T00:00:00.000Z'),
            },
          },
        ],
        id: 77n,
        organizationId: 4n,
        invoiceNumber: 'INV-2026-001',
        direction: 'payable' as const,
        invoiceType: 'supplier_goods' as const,
        status: 'issued' as const,
        supplierId: 8n,
        supplierOrderId: 101n,
        issueDate: new Date('2026-06-03T00:00:00.000Z'),
        dueDate: new Date('2026-06-30T00:00:00.000Z'),
        currencyCode: 'EUR',
        exchangeRateToBase: null,
        subtotalAmount: new Prisma.Decimal('1000.00'),
        taxAmount: new Prisma.Decimal('150.00'),
        totalAmount: new Prisma.Decimal('1150.00'),
        amountPaid: new Prisma.Decimal('300.00'),
        balanceDue: new Prisma.Decimal('850.00'),
        notes: 'Awaiting remainder',
        createdAt: new Date('2026-06-03T00:00:00.000Z'),
        updatedAt: new Date('2026-06-04T00:00:00.000Z'),
      },
    ],
    status: 'confirmed' as const,
    orderNumber: 'SO-000101',
    supplierPoNumber: 'PO-2026-009',
    orderDate: new Date('2026-06-01T00:00:00.000Z'),
    confirmedAt: new Date('2026-06-02T00:00:00.000Z'),
    expectedReadyDate: new Date('2026-06-10T00:00:00.000Z'),
    expectedShipDate: new Date('2026-06-15T00:00:00.000Z'),
    expectedArrivalDate: new Date('2026-07-01T00:00:00.000Z'),
    currencyCode: 'EUR',
    subtotalAmount: new Prisma.Decimal('1000.00'),
    shippingAmount: new Prisma.Decimal('100.00'),
    taxAmount: new Prisma.Decimal('50.00'),
    totalAmount: new Prisma.Decimal('1150.00'),
    incoterm: 'FOB',
    paymentTerms: 'Net 30',
    loadingPort: 'Shenzhen',
    destinationPort: 'Rotterdam',
    notes: 'Ready for booking',
    createdByUserId: 9n,
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    updatedAt: new Date('2026-06-02T00:00:00.000Z'),
  };

  it('maps supplier-order list records with grouped order statuses', () => {
    const response = toSupplierOrderListItemResponse({
      ...supplierOrderRecord,
      status: 'confirmed',
    });

    expect(response).toEqual(
      expect.objectContaining({
        id: '101',
        orderStatus: 'processing',
        invoices: [
          expect.objectContaining({
            id: '77',
          }),
        ],
      }),
    );
  });

  it('maps supplier-order detail records with line and invoice summaries', async () => {
    const response = await toSupplierOrderDetailResponse(
      supplierOrderRecord,
      storageService as never,
    );

    expect(response.id).toBe('101');
    expect(response.status).toBe('confirmed');
    expect(response.currencyCode).toBe('EUR');
    expect(response.supplier).toEqual({
      id: '8',
      name: 'Acme Supply',
      phoneNumber: null,
      email: 'ops@acme.test',
      address: null,
      website: null,
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    });
    expect(response.quote).toEqual({
      id: '12',
      supplier: {
        id: '8',
        name: 'Acme Supply',
        phoneNumber: null,
        email: 'ops@acme.test',
        address: null,
        website: null,
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      },
      total: {
        amount: 1150,
        currencyCode: 'EUR',
      },
      quoteNumber: 'Q-2026-001',
      quoteDate: '2026-05-20T00:00:00.000Z',
      validUntil: '2026-06-20T00:00:00.000Z',
      paymentTerms: 'Net 30',
    });
    expect(response.orderLines).toEqual([
      {
        id: '91',
        supplierQuoteLineId: '71',
        houseModelId: '15',
        productConfigurationId: '19',
        description: 'Model A',
        quantity: 2,
        unitCost: {
          amount: 500,
          currencyCode: 'EUR',
        },
        lineTotal: {
          amount: 1000,
          currencyCode: 'EUR',
        },
        createdAt: '2026-06-01T00:00:00.000Z',
      },
    ]);
    expect(response.invoices).toEqual([
      {
        attachment: null,
        id: '77',
        invoiceNumber: 'INV-2026-001',
        direction: 'payable',
        invoiceType: 'supplier_goods',
        status: 'issued',
        issueDate: '2026-06-03T00:00:00.000Z',
        dueDate: '2026-06-30T00:00:00.000Z',
        currencyCode: 'EUR',
        subtotalAmount: {
          amount: 1000,
          currencyCode: 'EUR',
        },
        taxAmount: {
          amount: 150,
          currencyCode: 'EUR',
        },
        totalAmount: {
          amount: 1150,
          currencyCode: 'EUR',
        },
        amountPaid: {
          amount: 300,
          currencyCode: 'EUR',
        },
        balanceDue: {
          amount: 850,
          currencyCode: 'EUR',
        },
        installments: [
          {
            id: '19',
            installmentNumber: 1,
            status: 'partially_paid',
            dueDate: '2026-06-15T00:00:00.000Z',
            amountDue: {
              amount: 500,
              currencyCode: 'EUR',
            },
            amountPaid: {
              amount: 300,
              currencyCode: 'EUR',
            },
            balanceDue: {
              amount: 200,
              currencyCode: 'EUR',
            },
            paidAt: null,
            notes: 'Deposit',
            createdAt: '2026-06-03T00:00:00.000Z',
            updatedAt: '2026-06-04T00:00:00.000Z',
          },
        ],
        payments: [
          {
            id: '201',
            paymentReference: 'PAY-2026-0001',
            status: 'completed',
            paymentMethod: 'bank_transfer',
            paymentDate: '2026-06-04T00:00:00.000Z',
            amount: {
              amount: 300,
              currencyCode: 'EUR',
            },
            bankAccount: null,
            transactionId: null,
            notes: 'Deposit paid',
            invoiceInstallmentId: '19',
            createdAt: '2026-06-04T00:00:00.000Z',
            updatedAt: '2026-06-04T00:00:00.000Z',
          },
        ],
        notes: 'Awaiting remainder',
        createdAt: '2026-06-03T00:00:00.000Z',
        updatedAt: '2026-06-04T00:00:00.000Z',
      },
    ]);
  });
});
