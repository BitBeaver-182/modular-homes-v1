import { UserRolesController } from './user-roles.controller';
import { UserRolesService } from './user-roles.service';

describe('UserRolesController', () => {
  const userRolesService = {
    assignRole: jest.fn(),
    findAll: jest.fn(),
    removeRole: jest.fn(),
  };

  let controller: UserRolesController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new UserRolesController(
      userRolesService as unknown as UserRolesService,
    );
  });

  it('routes user-role operations', async () => {
    const rawRole = { id: 4n, name: 'Admin', description: null };
    userRolesService.assignRole.mockResolvedValue(rawRole);
    userRolesService.findAll.mockResolvedValue([rawRole]);
    userRolesService.removeRole.mockResolvedValue(rawRole);

    const created = await controller.assignRole(2n, '9', { roleId: '4' });
    const list = await controller.findAll(2n, '9');
    const removed = await controller.removeRole(2n, '9', '4');

    expect(userRolesService.assignRole).toHaveBeenCalledWith(2n, 9n, 4n);
    expect(userRolesService.findAll).toHaveBeenCalledWith(2n, 9n);
    expect(userRolesService.removeRole).toHaveBeenCalledWith(2n, 9n, 4n);
    expect(created.name).toBe('Admin');
    expect(list[0].id).toBe('4');
    expect(removed.name).toBe('Admin');
  });
});
