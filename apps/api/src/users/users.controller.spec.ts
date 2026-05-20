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
    usersService.findOne.mockResolvedValue({ id: 1n });
    usersService.update.mockResolvedValue({ id: 1n, name: 'updated' });

    const createDto = { email: 'user@example.com', organizationId: '1' };
    await controller.create(createDto);
    await controller.findAll();
    await controller.findOne('1');
    await controller.update('1', { name: 'updated' });
    await controller.remove('1');

    expect(usersService.create).toHaveBeenCalledWith(createDto);
    expect(usersService.findAll).toHaveBeenCalledTimes(1);
    expect(usersService.findOne).toHaveBeenCalledWith(1n);
    expect(usersService.update).toHaveBeenCalledWith(1n, { name: 'updated' });
    expect(usersService.remove).toHaveBeenCalledWith(1n);
  });

  it('rejects malformed user id before hitting service', () => {
    expect(() => controller.findOne('abc')).toThrow();
    expect(() => controller.update('abc', { name: 'x' })).toThrow();

    expect(usersService.findOne).not.toHaveBeenCalled();
    expect(usersService.update).not.toHaveBeenCalled();
  });
});
