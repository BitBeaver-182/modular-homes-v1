import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';

describe('SuppliersController', () => {
  const suppliersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  let controller: SuppliersController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new SuppliersController(
      suppliersService as unknown as SuppliersService,
    );
  });

  it('routes CRUD operations through the scoped service', async () => {
    const rawSupplier = {
      id: 1n,
      organizationId: 2n,
      name: 'Acme Supply',
      phoneNumber: null,
      email: 'orders@example.com',
      address: null,
      website: null,
      deletedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    suppliersService.create.mockResolvedValue(rawSupplier);
    suppliersService.findAll.mockResolvedValue({
      data: [rawSupplier],
      meta: {
        pagination: { page: 1, pageSize: 15, pageCount: 1, total: 1 },
      },
    });
    suppliersService.findOne.mockResolvedValue(rawSupplier);
    suppliersService.update.mockResolvedValue(rawSupplier);
    suppliersService.remove.mockResolvedValue(rawSupplier);

    const created = await controller.create(2n, { name: 'Acme Supply' });
    const list = await controller.findAll(2n, { page: '1' });
    const one = await controller.findOne(2n, '1');
    const updated = await controller.update(2n, '1', { name: 'Acme Supply' });
    await controller.remove(2n, '1');

    expect(suppliersService.create).toHaveBeenCalledWith(2n, {
      name: 'Acme Supply',
    });
    expect(suppliersService.findAll).toHaveBeenCalledWith(2n, { page: '1' });
    expect(suppliersService.findOne).toHaveBeenCalledWith(2n, 1n);
    expect(suppliersService.update).toHaveBeenCalledWith(2n, 1n, {
      name: 'Acme Supply',
    });
    expect(suppliersService.remove).toHaveBeenCalledWith(2n, 1n);
    expect(created).toEqual(
      expect.objectContaining({
        id: 1n,
        name: 'Acme Supply',
        email: 'orders@example.com',
      }),
    );
    expect(list.meta.pagination.total).toBe(1);
    expect(one.name).toBe('Acme Supply');
    expect(updated.name).toBe('Acme Supply');
    expect(created).not.toHaveProperty('organizationId');
    expect(created).not.toHaveProperty('deletedAt');
  });
});
