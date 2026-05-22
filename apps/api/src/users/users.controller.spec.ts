import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  const usersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  let controller: UsersController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new UsersController(usersService as unknown as UsersService);
  });

  it('routes global CRUD calls to service', async () => {
    const rawUser = {
      id: 1n,
      email: 'user@example.com',
      name: 'Updated',
      avatarUrl: null,
      organizationUsers: [
        {
          organizationId: 2n,
          organization: { id: 2n, name: 'Acme', slug: 'acme', deletedAt: null },
          userRoles: [
            {
              role: { id: 7n, name: 'Admin', description: 'Admin role' },
            },
          ],
        },
      ],
    };
    usersService.create.mockResolvedValue(rawUser);
    usersService.findAll.mockResolvedValue([rawUser]);
    usersService.findOne.mockResolvedValue(rawUser);
    usersService.update.mockResolvedValue(rawUser);
    usersService.remove.mockResolvedValue(rawUser);

    const createDto = { email: 'user@example.com' };
    const created = await controller.create(2n, createDto);
    const list = await controller.findAll(2n);
    const one = await controller.findOne(2n, '1');
    const updated = await controller.update(2n, '1', { name: 'updated' });
    await controller.remove(2n, '1');

    expect(usersService.create).toHaveBeenCalledWith(2n, createDto);
    expect(usersService.findAll).toHaveBeenCalledWith(2n);
    expect(usersService.findOne).toHaveBeenCalledWith(2n, 1n);
    expect(usersService.update).toHaveBeenCalledWith(2n, 1n, {
      name: 'updated',
    });
    expect(usersService.remove).toHaveBeenCalledWith(2n, 1n);
    expect(created.organization).toEqual(
      expect.objectContaining({ id: 2n, name: 'Acme', slug: 'acme' }),
    );
    expect(created.roles).toEqual([
      expect.objectContaining({ id: 7n, name: 'Admin' }),
    ]);
    expect('organizationUsers' in list[0]).toBe(false);
    expect(one.organization?.id).toBe(2n);
    expect(updated.roles).toHaveLength(1);
  });

  it('rejects malformed user id before hitting service', async () => {
    await expect(controller.findOne(2n, 'abc')).rejects.toThrow();
    await expect(controller.update(2n, 'abc', { name: 'x' })).rejects.toThrow();

    expect(usersService.findOne).not.toHaveBeenCalled();
    expect(usersService.update).not.toHaveBeenCalled();
  });
});
