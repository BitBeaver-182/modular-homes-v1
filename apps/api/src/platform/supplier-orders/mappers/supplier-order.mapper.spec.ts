import { Prisma } from '@prisma/client';
import {
  type SupplierOrderWithRelations,
  toSupplierOrderDetailResponse,
  toSupplierOrderListItemResponse,
} from './supplier-order.mapper';

describe('supplier-order mapper', () => {
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

  it('maps supplier-order detail records with line and invoice summaries', () => {
    const response = toSupplierOrderDetailResponse(supplierOrderRecord);

    expect(response).toEqual(
      expect.objectContaining({
        id: '101',
        status: 'confirmed',
        currencyCode: 'EUR',
        supplier: expect.objectContaining({
          id: '8',
          name: 'Acme Supply',
        }),
        quote: expect.objectContaining({
          id: '12',
          quoteNumber: 'Q-2026-001',
        }),
        orderLines: [
          expect.objectContaining({
            id: '91',
            houseModelId: '15',
            productConfigurationId: '19',
            quantity: 2,
          }),
        ],
        invoices: [
          expect.objectContaining({
            id: '77',
            invoiceNumber: 'INV-2026-001',
            status: 'issued',
            totalAmount: {
              amount: 1150,
              currencyCode: 'EUR',
            },
          }),
        ],
      }),
    );
  });
});
