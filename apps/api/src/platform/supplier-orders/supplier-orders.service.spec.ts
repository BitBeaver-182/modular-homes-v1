/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { SupplierOrdersService } from './supplier-orders.service';

describe('SupplierOrdersService', () => {
  const prisma = {
    supplierOrder: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  let service: SupplierOrdersService;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.supplierOrder.findMany.mockResolvedValue([{ id: 1n }]);
    prisma.supplierOrder.count.mockResolvedValue(1);
    service = new SupplierOrdersService(prisma as never);
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
});
