import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const prisma = {
    user: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  const organizationUsersService = {
    createUserInOrganization: jest.fn(),
    removeUserFromOrganization: jest.fn(),
  };

  let service: UsersService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new UsersService(
      prisma as never,
      organizationUsersService as never,
    );
  });

  it('delegates create to organization users service', async () => {
    organizationUsersService.createUserInOrganization.mockResolvedValue({
      id: 10n,
      email: 'user@example.com',
    });

    await service.create(2n, { email: 'user@example.com' });

    expect(
      organizationUsersService.createUserInOrganization,
    ).toHaveBeenCalledWith(2n, {
      email: 'user@example.com',
    });
  });

  it('throws not found when user is missing', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(service.findOne(2n, 99n)).rejects.toThrow(NotFoundException);
  });

  it('delegates remove to organization users service', async () => {
    organizationUsersService.removeUserFromOrganization.mockResolvedValue(
      undefined,
    );

    await service.remove(2n, 1n);

    expect(
      organizationUsersService.removeUserFromOrganization,
    ).toHaveBeenCalledWith(2n, 1n);
  });

  it('returns active users scoped to the current organization in findAll', async () => {
    prisma.user.findMany.mockResolvedValue([
      {
        id: 1n,
        email: 'user@example.com',
        organizationUsers: [
          {
            organizationId: 2n,
            organization: {
              id: 2n,
              name: 'Acme',
              slug: 'acme',
              deletedAt: null,
            },
            userRoles: [],
          },
        ],
      },
    ]);

    const result = await service.findAll(2n);

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        organizationUsers: {
          some: {
            organizationId: 2n,
            deletedAt: null,
            status: 'active',
          },
        },
      },
      include: {
        organizationUsers: {
          where: {
            organizationId: 2n,
            deletedAt: null,
            status: 'active',
          },
          include: {
            organization: true,
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });
    expect(result).toHaveLength(1);
    expect(result[0].organizationUsers).toHaveLength(1);
  });

  it('returns user in findOne when found', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 1n,
      email: 'user@example.com',
      organizationUsers: [
        {
          organizationId: 2n,
          organization: { id: 2n, name: 'Acme', slug: 'acme', deletedAt: null },
          userRoles: [],
        },
      ],
    });

    const result = await service.findOne(2n, 1n);

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        id: 1n,
        deletedAt: null,
        organizationUsers: {
          some: {
            organizationId: 2n,
            deletedAt: null,
            status: 'active',
          },
        },
      },
      include: {
        organizationUsers: {
          where: {
            organizationId: 2n,
            deletedAt: null,
            status: 'active',
          },
          include: {
            organization: true,
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });
    expect(result.id).toBe(1n);
    expect(result.organizationUsers).toHaveLength(1);
  });

  it('updates user after existence check', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 1n,
      email: 'user@example.com',
      organizationUsers: [],
    });
    prisma.user.update.mockResolvedValue({
      id: 1n,
      email: 'updated@example.com',
      organizationUsers: [],
    });

    const dto = { email: 'updated@example.com', name: 'Updated' };
    const result = await service.update(2n, 1n, dto);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 1n },
      data: {
        email: 'updated@example.com',
        name: 'Updated',
        avatarUrl: undefined,
      },
      include: {
        organizationUsers: {
          where: {
            organizationId: 2n,
            deletedAt: null,
            status: 'active',
          },
          include: {
            organization: true,
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });
    expect(result.email).toBe('updated@example.com');
    expect(result.organizationUsers).toEqual([]);
  });
});
