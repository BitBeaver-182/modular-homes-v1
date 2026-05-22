import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserRolesService } from './user-roles.service';

describe('UserRolesService', () => {
  const prisma = {
    organizationUser: {
      findFirst: jest.fn(),
    },
    role: {
      findFirst: jest.fn(),
    },
    userRole: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  };

  let service: UserRolesService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new UserRolesService(prisma as never);
  });

  it('assigns a role within the same organization', async () => {
    prisma.organizationUser.findFirst.mockResolvedValue({ id: 8n });
    prisma.role.findFirst.mockResolvedValue({ id: 4n, name: 'Admin' });

    const result = await service.assignRole(2n, 9n, 4n);

    expect(prisma.userRole.create).toHaveBeenCalledWith({
      data: {
        organizationUserId: 8n,
        roleId: 4n,
      },
    });
    expect(result.name).toBe('Admin');
  });

  it('rejects duplicate assignments', async () => {
    prisma.organizationUser.findFirst.mockResolvedValue({ id: 8n });
    prisma.role.findFirst.mockResolvedValue({ id: 4n, name: 'Admin' });
    prisma.userRole.create.mockRejectedValue({ code: 'P2002' });

    await expect(service.assignRole(2n, 9n, 4n)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('lists assigned roles', async () => {
    prisma.organizationUser.findFirst.mockResolvedValue({ id: 8n });
    prisma.userRole.findMany.mockResolvedValue([
      { role: { id: 4n, name: 'Admin', description: null } },
    ]);

    const roles = await service.findAll(2n, 9n);

    expect(roles).toEqual([{ id: 4n, name: 'Admin', description: null }]);
  });

  it('throws when removing a missing role assignment', async () => {
    prisma.organizationUser.findFirst.mockResolvedValue({ id: 8n });
    prisma.userRole.findFirst.mockResolvedValue(null);

    await expect(service.removeRole(2n, 9n, 4n)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('removes an assigned role', async () => {
    prisma.organizationUser.findFirst.mockResolvedValue({ id: 8n });
    prisma.userRole.findFirst.mockResolvedValue({
      id: 7n,
      role: { id: 4n, name: 'Admin', description: null },
    });

    const result = await service.removeRole(2n, 9n, 4n);

    expect(prisma.userRole.delete).toHaveBeenCalledWith({
      where: { id: 7n },
    });
    expect(result.name).toBe('Admin');
  });

  it('throws when the org user is missing', async () => {
    prisma.organizationUser.findFirst.mockResolvedValue(null);

    await expect(service.findAll(2n, 9n)).rejects.toThrow(NotFoundException);
  });
});
