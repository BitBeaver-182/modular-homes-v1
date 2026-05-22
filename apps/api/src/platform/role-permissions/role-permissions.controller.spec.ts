import { RolePermissionsController } from './role-permissions.controller';
import { RolePermissionsService } from './role-permissions.service';

describe('RolePermissionsController', () => {
  const rolePermissionsService = {
    assignPermission: jest.fn(),
    findAll: jest.fn(),
    removePermission: jest.fn(),
  };

  let controller: RolePermissionsController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new RolePermissionsController(
      rolePermissionsService as unknown as RolePermissionsService,
    );
  });

  it('routes role-permission operations', async () => {
    const rawPermission = {
      id: 2n,
      key: 'catalog.manage',
      description: null,
    };
    rolePermissionsService.assignPermission.mockResolvedValue(rawPermission);
    rolePermissionsService.findAll.mockResolvedValue([rawPermission]);
    rolePermissionsService.removePermission.mockResolvedValue(rawPermission);

    const created = await controller.assignPermission(3n, '5', {
      permissionId: '2',
    });
    const list = await controller.findAll(3n, '5');
    const removed = await controller.removePermission(3n, '5', '2');

    expect(rolePermissionsService.assignPermission).toHaveBeenCalledWith(
      3n,
      5n,
      2n,
    );
    expect(rolePermissionsService.findAll).toHaveBeenCalledWith(3n, 5n);
    expect(rolePermissionsService.removePermission).toHaveBeenCalledWith(
      3n,
      5n,
      2n,
    );
    expect(created.key).toBe('catalog.manage');
    expect(list[0].id).toBe(2n);
    expect(removed.key).toBe('catalog.manage');
  });
});
