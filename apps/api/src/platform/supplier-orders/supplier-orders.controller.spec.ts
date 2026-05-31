import { SupplierOrdersController } from './supplier-orders.controller';
import { SupplierOrdersService } from './supplier-orders.service';

describe('SupplierOrdersController', () => {
  const supplierOrdersService = {
    findAll: jest.fn(),
  };

  let controller: SupplierOrdersController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new SupplierOrdersController(
      supplierOrdersService as unknown as SupplierOrdersService,
    );
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
});
