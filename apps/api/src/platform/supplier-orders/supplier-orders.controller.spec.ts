import { SupplierOrdersController } from './supplier-orders.controller';
import { SupplierOrdersService } from './supplier-orders.service';

describe('SupplierOrdersController', () => {
  const supplierOrdersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  let controller: SupplierOrdersController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new SupplierOrdersController(
      supplierOrdersService as unknown as SupplierOrdersService,
    );
  });

  it('creates a supplier order from an accepted quote through the scoped service', async () => {
    supplierOrdersService.create.mockResolvedValue({
      id: 101n,
      supplier: {
        id: 8n,
        name: 'Acme Supply',
        phoneNumber: null,
        email: null,
        address: null,
        website: null,
        createdAt: new Date('2026-06-01T00:00:00.000Z'),
        updatedAt: new Date('2026-06-01T00:00:00.000Z'),
      },
      supplierQuote: null,
      invoices: [],
      status: 'draft',
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      updatedAt: new Date('2026-06-02T00:00:00.000Z'),
    });

    const response = await controller.create(
      {
        userId: 9n,
        email: 'buyer@example.com',
        organizationId: 2n,
        governanceRole: 'member',
      },
      { quoteId: '12' },
    );

    expect(supplierOrdersService.create).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 2n }),
      { quoteId: '12' },
    );
    expect(response.id).toBe('101');
  });

  it('returns a paginated supplier-order list through the scoped service', async () => {
    supplierOrdersService.findAll.mockResolvedValue({
      data: [
        {
          id: 101n,
          supplier: {
            id: 8n,
            name: 'Acme Supply',
            phoneNumber: null,
            email: null,
            address: null,
            website: null,
            createdAt: new Date('2026-06-01T00:00:00.000Z'),
            updatedAt: new Date('2026-06-01T00:00:00.000Z'),
          },
          supplierQuote: null,
          invoices: [],
          status: 'draft',
          createdAt: new Date('2026-06-01T00:00:00.000Z'),
          updatedAt: new Date('2026-06-02T00:00:00.000Z'),
        },
      ],
      meta: {
        pagination: { page: 1, pageSize: 10, pageCount: 1, total: 1 },
      },
    });

    const response = await controller.findAll(2n, { page: 1 });

    expect(supplierOrdersService.findAll).toHaveBeenCalledWith(2n, {
      page: 1,
    });
    expect(response.data[0]).toEqual(
      expect.objectContaining({
        id: '101',
        orderStatus: 'draft',
      }),
    );
    expect(response.meta.pagination.total).toBe(1);
  });

  it('returns a supplier-order detail view through the scoped service', async () => {
    supplierOrdersService.findOne.mockResolvedValue({
      id: 101n,
      supplierId: 8n,
      supplierQuoteId: null,
      supplier: {
        id: 8n,
        name: 'Acme Supply',
        phoneNumber: null,
        email: null,
        address: null,
        website: null,
        createdAt: new Date('2026-06-01T00:00:00.000Z'),
        updatedAt: new Date('2026-06-01T00:00:00.000Z'),
      },
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
      subtotalAmount: 1000,
      shippingAmount: 100,
      taxAmount: 50,
      totalAmount: 1150,
      incoterm: null,
      paymentTerms: null,
      loadingPort: null,
      destinationPort: null,
      notes: null,
      createdByUserId: null,
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      updatedAt: new Date('2026-06-02T00:00:00.000Z'),
    });

    const response = await controller.findOne(2n, '101');

    expect(supplierOrdersService.findOne).toHaveBeenCalledWith(2n, '101');
    expect(response).toEqual(
      expect.objectContaining({
        id: '101',
        status: 'confirmed',
        orderNumber: 'SO-000101',
      }),
    );
  });
});
