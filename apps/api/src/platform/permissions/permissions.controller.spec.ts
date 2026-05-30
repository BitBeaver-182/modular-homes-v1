import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';

describe('PermissionsController', () => {
  const permissionsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  let controller: PermissionsController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new PermissionsController(
      permissionsService as unknown as PermissionsService,
    );
  });

  it('routes CRUD operations', async () => {
    const rawPermission = {
      id: 1n,
      key: 'catalog.manage',
      description: 'Manage catalog',
    };
    permissionsService.create.mockResolvedValue(rawPermission);
    permissionsService.findAll.mockResolvedValue([rawPermission]);
    permissionsService.findOne.mockResolvedValue(rawPermission);
    permissionsService.update.mockResolvedValue(rawPermission);
    permissionsService.remove.mockResolvedValue(rawPermission);

    const created = await controller.create({ key: 'catalog.manage' });
    const list = await controller.findAll();
    const one = await controller.findOne('1');
    const updated = await controller.update('1', { key: 'catalog.view' });
    const removed = await controller.remove('1');

    expect(permissionsService.create).toHaveBeenCalledWith({
      key: 'catalog.manage',
    });
    expect(permissionsService.findAll).toHaveBeenCalledTimes(1);
    expect(permissionsService.findOne).toHaveBeenCalledWith(1n);
    expect(permissionsService.update).toHaveBeenCalledWith(1n, {
      key: 'catalog.view',
    });
    expect(permissionsService.remove).toHaveBeenCalledWith(1n);
    expect(created.key).toBe('catalog.manage');
    expect(list[0].id).toBe('1');
    expect(one.description).toBe('Manage catalog');
    expect(updated.key).toBe('catalog.manage');
    expect(removed.id).toBe('1');
  });
});
