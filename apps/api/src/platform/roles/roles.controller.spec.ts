import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

describe('RolesController', () => {
  const rolesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  let controller: RolesController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new RolesController(rolesService as unknown as RolesService);
  });

  it('routes CRUD operations through the scoped service', async () => {
    const rawRole = { id: 1n, name: 'Admin', description: 'Admin role' };
    rolesService.create.mockResolvedValue(rawRole);
    rolesService.findAll.mockResolvedValue([rawRole]);
    rolesService.findOne.mockResolvedValue(rawRole);
    rolesService.update.mockResolvedValue(rawRole);
    rolesService.remove.mockResolvedValue(rawRole);

    const created = await controller.create(2n, { name: 'Admin' });
    const list = await controller.findAll(2n);
    const one = await controller.findOne(2n, '1');
    const updated = await controller.update(2n, '1', { name: 'Admin' });
    const removed = await controller.remove(2n, '1');

    expect(rolesService.create).toHaveBeenCalledWith(2n, { name: 'Admin' });
    expect(rolesService.findAll).toHaveBeenCalledWith(2n);
    expect(rolesService.findOne).toHaveBeenCalledWith(2n, 1n);
    expect(rolesService.update).toHaveBeenCalledWith(2n, 1n, {
      name: 'Admin',
    });
    expect(rolesService.remove).toHaveBeenCalledWith(2n, 1n);
    expect(created.name).toBe('Admin');
    expect(list[0].id).toBe('1');
    expect(one.description).toBe('Admin role');
    expect(updated.name).toBe('Admin');
    expect(removed.id).toBe('1');
  });
});
