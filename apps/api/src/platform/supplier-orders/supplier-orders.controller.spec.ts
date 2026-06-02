import { SupplierOrdersController } from './supplier-orders.controller';
import { SupplierOrdersService } from './supplier-orders.service';

describe('SupplierOrdersController', () => {
  const findOne = jest.fn();
  const createInvoice = jest.fn();
  const updateInvoice = jest.fn();
  const supplierOrdersService = {
    create: jest.fn(),
    createInvoice,
    createInvoiceResponse: createInvoice,
    deleteInvoice: jest.fn(),
    findAll: jest.fn(),
    findOne,
    findOneResponse: findOne,
    update: jest.fn(),
    updateInvoice,
    updateInvoiceResponse: updateInvoice,
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
    supplierOrdersService.findOneResponse.mockResolvedValue({
      id: '101',
      supplierPoNumber: 'PO-2026-009',
      supplier: {
        id: '8',
        name: 'Acme Supply',
        phoneNumber: null,
        email: null,
        address: null,
        website: null,
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      },
      quote: null,
      orderLines: [],
      invoices: [],
      status: 'confirmed',
      orderNumber: 'SO-000101',
      orderDate: '2026-06-01T00:00:00.000Z',
      confirmedAt: null,
      expectedReadyDate: null,
      expectedShipDate: null,
      expectedArrivalDate: null,
      currencyCode: 'EUR',
      subtotalAmount: { amount: 1000, currencyCode: 'EUR' },
      shippingAmount: { amount: 100, currencyCode: 'EUR' },
      taxAmount: { amount: 50, currencyCode: 'EUR' },
      totalAmount: { amount: 1150, currencyCode: 'EUR' },
      incoterm: null,
      paymentTerms: null,
      loadingPort: null,
      destinationPort: null,
      notes: null,
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-02T00:00:00.000Z',
    });

    const response = await controller.findOne(2n, '101');

    expect(supplierOrdersService.findOneResponse).toHaveBeenCalledWith(
      2n,
      '101',
    );
    expect(response).toEqual(
      expect.objectContaining({
        id: '101',
        status: 'confirmed',
        orderNumber: 'SO-000101',
      }),
    );
  });

  it('updates supplier-order lines through the scoped service', async () => {
    supplierOrdersService.update.mockResolvedValue(undefined);
    supplierOrdersService.findOneResponse.mockResolvedValue({
      id: '101',
      supplier: null,
      quote: null,
      orderLines: [],
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
      subtotalAmount: { amount: 1000, currencyCode: 'EUR' },
      shippingAmount: { amount: 100, currencyCode: 'EUR' },
      taxAmount: { amount: 50, currencyCode: 'EUR' },
      totalAmount: { amount: 1150, currencyCode: 'EUR' },
      incoterm: null,
      paymentTerms: null,
      loadingPort: null,
      destinationPort: null,
      notes: null,
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-02T00:00:00.000Z',
    });

    const response = await controller.update(2n, '101', {
      orderLines: [
        {
          description: 'Updated line',
          quantity: 2,
          unitCost: 500,
        },
      ],
    });

    expect(supplierOrdersService.update).toHaveBeenCalledWith(2n, '101', {
      orderLines: [
        {
          description: 'Updated line',
          quantity: 2,
          unitCost: 500,
        },
      ],
    });
    expect(response).toEqual(
      expect.objectContaining({
        id: '101',
        totalAmount: {
          amount: 1150,
          currencyCode: 'EUR',
        },
      }),
    );
  });

  it('creates a supplier-order invoice through the scoped service', async () => {
    supplierOrdersService.createInvoiceResponse.mockResolvedValue({
      id: '77',
      attachment: null,
      invoiceNumber: 'INV-2026-001',
      direction: 'payable',
      invoiceType: 'supplier_goods',
      status: 'issued',
      issueDate: '2026-06-03T00:00:00.000Z',
      dueDate: '2026-06-30T00:00:00.000Z',
      currencyCode: 'EUR',
      subtotalAmount: { amount: 1000, currencyCode: 'EUR' },
      taxAmount: { amount: 150, currencyCode: 'EUR' },
      totalAmount: { amount: 1150, currencyCode: 'EUR' },
      amountPaid: { amount: 0, currencyCode: 'EUR' },
      balanceDue: { amount: 1150, currencyCode: 'EUR' },
      notes: 'Awaiting remainder',
      createdAt: '2026-06-03T00:00:00.000Z',
      updatedAt: '2026-06-03T00:00:00.000Z',
    });

    const response = await controller.createInvoice(2n, '101', {
      invoiceNumber: 'INV-2026-001',
      invoiceType: 'supplier_goods',
      status: 'issued',
      issueDate: '2026-06-03',
      dueDate: '2026-06-30',
      subtotalAmount: 1000,
      taxAmount: 150,
      notes: 'Awaiting remainder',
    });

    expect(supplierOrdersService.createInvoiceResponse).toHaveBeenCalledWith(
      2n,
      '101',
      {
        invoiceNumber: 'INV-2026-001',
        invoiceType: 'supplier_goods',
        status: 'issued',
        issueDate: '2026-06-03',
        dueDate: '2026-06-30',
        subtotalAmount: 1000,
        taxAmount: 150,
        notes: 'Awaiting remainder',
      },
    );
    expect(response).toEqual(
      expect.objectContaining({
        id: '77',
        direction: 'payable',
        totalAmount: { amount: 1150, currencyCode: 'EUR' },
      }),
    );
  });

  it('updates a supplier-order invoice through the scoped service', async () => {
    supplierOrdersService.updateInvoiceResponse.mockResolvedValue({
      id: '77',
      attachment: null,
      invoiceNumber: 'INV-2026-001',
      direction: 'payable',
      invoiceType: 'supplier_goods',
      status: 'partially_paid',
      issueDate: '2026-06-03T00:00:00.000Z',
      dueDate: '2026-06-30T00:00:00.000Z',
      currencyCode: 'EUR',
      subtotalAmount: { amount: 900, currencyCode: 'EUR' },
      taxAmount: { amount: 135, currencyCode: 'EUR' },
      totalAmount: { amount: 1035, currencyCode: 'EUR' },
      amountPaid: { amount: 300, currencyCode: 'EUR' },
      balanceDue: { amount: 735, currencyCode: 'EUR' },
      notes: 'Revised',
      createdAt: '2026-06-03T00:00:00.000Z',
      updatedAt: '2026-06-04T00:00:00.000Z',
    });

    const response = await controller.updateInvoice(2n, '101', '77', {
      invoiceNumber: 'INV-2026-001',
      invoiceType: 'supplier_goods',
      status: 'partially_paid',
      issueDate: '2026-06-03',
      dueDate: '2026-06-30',
      subtotalAmount: 900,
      taxAmount: 135,
      notes: 'Revised',
    });

    expect(supplierOrdersService.updateInvoiceResponse).toHaveBeenCalledWith(
      2n,
      '101',
      '77',
      {
        invoiceNumber: 'INV-2026-001',
        invoiceType: 'supplier_goods',
        status: 'partially_paid',
        issueDate: '2026-06-03',
        dueDate: '2026-06-30',
        subtotalAmount: 900,
        taxAmount: 135,
        notes: 'Revised',
      },
    );
    expect(response).toEqual(
      expect.objectContaining({
        id: '77',
        status: 'partially_paid',
      }),
    );
  });

  it('deletes a supplier-order invoice through the scoped service', async () => {
    supplierOrdersService.deleteInvoice.mockResolvedValue(undefined);

    await controller.deleteInvoice(2n, '101', '77');

    expect(supplierOrdersService.deleteInvoice).toHaveBeenCalledWith(
      2n,
      '101',
      '77',
    );
  });
});
