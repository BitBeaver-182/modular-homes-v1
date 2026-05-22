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
      memberships: [
        {
          id: 3n,
          organizationId: 2n,
          organization: { id: 2n, name: 'Acme', slug: 'acme', deletedAt: null },
        },
      ],
    };
    usersService.create.mockResolvedValue(rawUser);
    usersService.findAll.mockResolvedValue([rawUser]);
    usersService.findOne.mockResolvedValue(rawUser);
    usersService.update.mockResolvedValue(rawUser);
    usersService.remove.mockResolvedValue(rawUser);

    const createDto = { email: 'user@example.com', organizationId: '1' };
    const created = await controller.create(createDto);
    const list = await controller.findAll();
    const one = await controller.findOne('1');
    const updated = await controller.update('1', { name: 'updated' });
    const removed = await controller.remove('1');

    expect(usersService.create).toHaveBeenCalledWith(createDto);
    expect(usersService.findAll).toHaveBeenCalledTimes(1);
    expect(usersService.findOne).toHaveBeenCalledWith(1n);
    expect(usersService.update).toHaveBeenCalledWith(1n, { name: 'updated' });
    expect(usersService.remove).toHaveBeenCalledWith(1n);
    expect(created.organizations).toEqual([
      expect.objectContaining({ id: 2n, name: 'Acme', slug: 'acme' }),
    ]);
    expect('memberships' in list[0]).toBe(false);
    expect(one.organizations).toHaveLength(1);
    expect(updated.organizations).toHaveLength(1);
    expect(removed.organizations).toHaveLength(1);
  });

  it('rejects malformed user id before hitting service', async () => {
    await expect(controller.findOne('abc')).rejects.toThrow();
    await expect(controller.update('abc', { name: 'x' })).rejects.toThrow();

    expect(usersService.findOne).not.toHaveBeenCalled();
    expect(usersService.update).not.toHaveBeenCalled();
  });
});
