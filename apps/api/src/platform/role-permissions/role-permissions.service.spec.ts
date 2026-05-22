import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RolePermissionsService } from './role-permissions.service';

describe('RolePermissionsService', () => {
  const prisma = {
    role: {
      findFirst: jest.fn(),
    },
    permission: {
      findUnique: jest.fn(),
    },
    rolePermission: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  };

  let service: RolePermissionsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new RolePermissionsService(prisma as never);
  });

  it('assigns a permission to a scoped role', async () => {
    prisma.role.findFirst.mockResolvedValue({ id: 5n });
    prisma.permission.findUnique.mockResolvedValue({
      id: 2n,
      key: 'catalog.manage',
    });

    const result = await service.assignPermission(3n, 5n, 2n);

    expect(prisma.rolePermission.create).toHaveBeenCalledWith({
      data: {
        roleId: 5n,
        permissionId: 2n,
      },
    });
    expect(result.key).toBe('catalog.manage');
  });

  it('rejects duplicate role-permission assignments', async () => {
    prisma.role.findFirst.mockResolvedValue({ id: 5n });
    prisma.permission.findUnique.mockResolvedValue({
      id: 2n,
      key: 'catalog.manage',
    });
    prisma.rolePermission.create.mockRejectedValue({ code: 'P2002' });

    await expect(service.assignPermission(3n, 5n, 2n)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('lists permissions for a role', async () => {
    prisma.role.findFirst.mockResolvedValue({ id: 5n });
    prisma.rolePermission.findMany.mockResolvedValue([
      { permission: { id: 2n, key: 'catalog.manage', description: null } },
    ]);

    const permissions = await service.findAll(3n, 5n);

    expect(permissions).toEqual([
      { id: 2n, key: 'catalog.manage', description: null },
    ]);
  });

  it('throws when role permission is missing on delete', async () => {
    prisma.rolePermission.findFirst.mockResolvedValue(null);

    await expect(service.removePermission(3n, 5n, 2n)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('removes an assigned permission', async () => {
    prisma.rolePermission.findFirst.mockResolvedValue({
      id: 6n,
      permission: { id: 2n, key: 'catalog.manage', description: null },
    });

    const permission = await service.removePermission(3n, 5n, 2n);

    expect(prisma.rolePermission.delete).toHaveBeenCalledWith({
      where: { id: 6n },
    });
    expect(permission.key).toBe('catalog.manage');
  });
});
