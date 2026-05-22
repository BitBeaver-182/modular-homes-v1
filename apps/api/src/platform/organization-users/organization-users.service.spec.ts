import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrganizationUsersService } from './organization-users.service';

describe('OrganizationUsersService', () => {
  const prisma = {
    organization: {
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    organizationUser: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  type TransactionCallback = (client: typeof prisma) => unknown;

  let service: OrganizationUsersService;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((callback: TransactionCallback) =>
      Promise.resolve(callback(prisma)),
    );
    service = new OrganizationUsersService(prisma as never);
  });

  it('first membership in an organization is created as owner', async () => {
    prisma.organization.findFirst.mockResolvedValue({ id: 2n });
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 9n });
    prisma.organizationUser.findUnique.mockResolvedValue(null);
    prisma.organizationUser.count.mockResolvedValue(0);
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      id: 9n,
      email: 'john@example.com',
      organizationUsers: [
        {
          organizationId: 2n,
          deletedAt: null,
          organization: { id: 2n, name: 'Acme', slug: 'acme', deletedAt: null },
          userRoles: [],
        },
      ],
    });

    const user = await service.createUserInOrganization(2n, {
      email: 'john@example.com',
      name: 'John',
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'john@example.com',
        name: 'John',
        avatarUrl: undefined,
      },
    });
    expect(prisma.organizationUser.create).toHaveBeenCalledWith({
      data: {
        organizationId: 2n,
        userId: 9n,
        governanceRole: 'owner',
        status: 'active',
      },
    });
    expect(user.organizationUsers).toHaveLength(1);
  });

  it('subsequent memberships in an organization are created as member', async () => {
    prisma.organization.findFirst.mockResolvedValue({ id: 2n });
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 9n });
    prisma.organizationUser.findUnique.mockResolvedValue(null);
    prisma.organizationUser.count.mockResolvedValue(1);
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      id: 9n,
      email: 'john@example.com',
      organizationUsers: [],
    });

    await service.createUserInOrganization(2n, {
      email: 'john@example.com',
    });

    expect(prisma.organizationUser.create).toHaveBeenCalledWith({
      data: {
        organizationId: 2n,
        userId: 9n,
        governanceRole: 'member',
        status: 'active',
      },
    });
  });

  it('membership defaults to active status on creation', async () => {
    prisma.organization.findFirst.mockResolvedValue({ id: 2n });
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 9n });
    prisma.organizationUser.findUnique.mockResolvedValue(null);
    prisma.organizationUser.count.mockResolvedValue(1);
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      id: 9n,
      email: 'john@example.com',
      organizationUsers: [],
    });

    await service.createUserInOrganization(2n, {
      email: 'john@example.com',
    });

    expect(prisma.organizationUser.create).toHaveBeenCalledWith({
      data: {
        organizationId: 2n,
        userId: 9n,
        governanceRole: 'member',
        status: 'active',
      },
    });
  });

  it('reactivates a soft deleted organization link', async () => {
    prisma.organization.findFirst.mockResolvedValue({ id: 2n });
    prisma.user.findUnique.mockResolvedValue({ id: 9n, deletedAt: null });
    prisma.organizationUser.findUnique.mockResolvedValue({
      id: 4n,
      deletedAt: new Date(),
      governanceRole: 'member',
    });
    prisma.organizationUser.count.mockResolvedValue(1);
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      id: 9n,
      email: 'john@example.com',
      organizationUsers: [],
    });

    await service.createUserInOrganization(2n, {
      email: 'john@example.com',
    });

    expect(prisma.organizationUser.update).toHaveBeenCalledWith({
      where: { id: 4n },
      data: {
        deletedAt: null,
        status: 'active',
        governanceRole: 'member',
      },
    });
  });

  it('rejects creating the same active org user twice', async () => {
    prisma.organization.findFirst.mockResolvedValue({ id: 2n });
    prisma.user.findUnique.mockResolvedValue({ id: 9n, deletedAt: null });
    prisma.organizationUser.findUnique.mockResolvedValue({
      id: 4n,
      deletedAt: null,
      governanceRole: 'member',
    });
    prisma.organizationUser.count.mockResolvedValue(1);

    await expect(
      service.createUserInOrganization(2n, { email: 'john@example.com' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('reactivates a soft deleted user before linking', async () => {
    prisma.organization.findFirst.mockResolvedValue({ id: 2n });
    prisma.user.findUnique.mockResolvedValue({ id: 9n, deletedAt: new Date() });
    prisma.user.update.mockResolvedValue({ id: 9n, deletedAt: null });
    prisma.organizationUser.findUnique.mockResolvedValue(null);
    prisma.organizationUser.count.mockResolvedValue(0);
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      id: 9n,
      email: 'john@example.com',
      organizationUsers: [],
    });

    await service.createUserInOrganization(2n, {
      email: 'john@example.com',
      avatarUrl: 'https://example.com/avatar.png',
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 9n },
      data: {
        deletedAt: null,
        name: undefined,
        avatarUrl: 'https://example.com/avatar.png',
      },
    });
  });

  it('finds an active org user', async () => {
    prisma.organizationUser.findFirst.mockResolvedValue({
      id: 1n,
      userId: 9n,
      organizationId: 2n,
      userRoles: [],
      organization: { id: 2n, name: 'Acme', slug: 'acme', deletedAt: null },
    });

    const result = await service.findActiveOrganizationUser(2n, 9n);

    expect(prisma.organizationUser.findFirst).toHaveBeenCalledWith({
      where: {
        organizationId: 2n,
        userId: 9n,
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
    });
    expect(result.id).toBe(1n);
  });

  it('throws when active org user is missing', async () => {
    prisma.organizationUser.findFirst.mockResolvedValue(null);

    await expect(service.findActiveOrganizationUser(2n, 9n)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('last active owner cannot be removed from the organization', async () => {
    prisma.organizationUser.findFirst.mockResolvedValue({
      id: 1n,
      governanceRole: 'owner',
    });
    prisma.organizationUser.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);

    await expect(service.removeUserFromOrganization(2n, 9n)).rejects.toThrow(
      BadRequestException,
    );

    expect(prisma.organizationUser.update).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('non-owner member can be removed while preserving owner invariant', async () => {
    prisma.organizationUser.findFirst.mockResolvedValue({
      id: 1n,
      governanceRole: 'member',
    });
    prisma.organizationUser.count.mockResolvedValueOnce(2);

    await service.removeUserFromOrganization(2n, 9n);

    const organizationUserUpdateArgs = prisma.organizationUser.update.mock
      .calls[0] as unknown as [
      {
        where: { id: bigint };
        data: { deletedAt: Date; status: string };
      },
    ];
    expect(organizationUserUpdateArgs[0].where.id).toBe(1n);
    expect(organizationUserUpdateArgs[0].data.status).toBe('removed');
    expect(organizationUserUpdateArgs[0].data.deletedAt).toBeInstanceOf(Date);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('owner can be removed when another active owner exists', async () => {
    prisma.organizationUser.findFirst.mockResolvedValue({
      id: 1n,
      governanceRole: 'owner',
    });
    prisma.organizationUser.count
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    prisma.user.update.mockResolvedValue({ id: 9n, deletedAt: new Date() });

    await service.removeUserFromOrganization(2n, 9n);

    const organizationUserUpdateArgs = prisma.organizationUser.update.mock
      .calls[0] as unknown as [
      {
        where: { id: bigint };
        data: { deletedAt: Date; status: string };
      },
    ];
    expect(organizationUserUpdateArgs[0].where.id).toBe(1n);
    expect(organizationUserUpdateArgs[0].data.status).toBe('removed');
    expect(organizationUserUpdateArgs[0].data.deletedAt).toBeInstanceOf(Date);
    expect(prisma.user.update).toHaveBeenCalled();
  });
});
