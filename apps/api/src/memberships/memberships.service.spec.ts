import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MembershipsService } from './memberships.service';

describe('MembershipsService', () => {
  const prisma = {
    organization: {
      findFirst: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    membership: {
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  type TransactionCallback = (client: typeof prisma) => unknown;

  let service: MembershipsService;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((callback: TransactionCallback) =>
      Promise.resolve(callback(prisma)),
    );
    service = new MembershipsService(prisma as never);
  });

  it('fails to create user without organizationId', async () => {
    await expect(
      service.createUserWithMembership({ email: 'x@example.com' } as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates user with initial organization membership', async () => {
    prisma.organization.findFirst.mockResolvedValue({ id: 2n });
    prisma.user.findUnique = jest.fn().mockResolvedValue(null);
    prisma.user.create = jest
      .fn()
      .mockResolvedValue({ id: 9n, email: 'john@acme.com' });
    prisma.membership.findFirst.mockResolvedValue(null);
    prisma.membership.create.mockResolvedValue({
      id: 1n,
      organizationId: 2n,
      userId: 9n,
    });
    prisma.user.findUniqueOrThrow = jest.fn().mockResolvedValue({
      id: 9n,
      email: 'john@acme.com',
      name: 'John',
      avatarUrl: null,
      memberships: [
        {
          id: 1n,
          organizationId: 2n,
          organization: { id: 2n, name: 'Acme', slug: 'acme', deletedAt: null },
        },
      ],
    });

    const user = await service.createUserWithMembership({
      email: 'john@acme.com',
      organizationId: '2',
      name: 'John',
    });

    expect(user).toBeDefined();
    expect(prisma.user.create).toHaveBeenCalled();
    expect(prisma.membership.create).toHaveBeenCalledWith({
      data: { userId: 9n, organizationId: 2n },
    });
    expect(user.memberships).toHaveLength(1);
  });

  it('reactivates a soft-deleted user and their membership', async () => {
    prisma.organization.findFirst.mockResolvedValue({ id: 2n });
    // User exists but is soft-deleted
    prisma.user.findUnique = jest.fn().mockResolvedValue({
      id: 9n,
      email: 'john@acme.com',
      deletedAt: new Date(),
    });
    prisma.user.update = jest.fn().mockResolvedValue({
      id: 9n,
      email: 'john@acme.com',
      deletedAt: null,
    });
    // Membership also exists and is soft-deleted
    prisma.membership.findFirst.mockResolvedValue({
      id: 1n,
      deletedAt: new Date(),
    });
    prisma.membership.update = jest.fn().mockResolvedValue({
      id: 1n,
      deletedAt: null,
    });
    prisma.user.findUniqueOrThrow = jest.fn().mockResolvedValue({
      id: 9n,
      email: 'john@acme.com',
      organizations: [],
      memberships: [
        {
          id: 1n,
          organizationId: 2n,
          organization: { id: 2n, name: 'Acme', slug: 'acme', deletedAt: null },
        },
      ],
    });

    const user = await service.createUserWithMembership({
      email: 'john@acme.com',
      organizationId: '2',
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 9n },
      data: { deletedAt: null, name: undefined, avatarUrl: undefined },
    });
    expect(prisma.membership.update).toHaveBeenCalledWith({
      where: { id: 1n },
      data: { deletedAt: null },
    });
    expect(user.memberships).toHaveLength(1);
  });

  it('fails creating user when an active user with same email exists', async () => {
    prisma.organization.findFirst.mockResolvedValue({ id: 2n });
    prisma.user.findUnique = jest.fn().mockResolvedValue({
      id: 9n,
      email: 'john@acme.com',
      deletedAt: null, // Active
    });

    await expect(
      service.createUserWithMembership({
        email: 'john@acme.com',
        organizationId: '2',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('attaches user to organization', async () => {
    prisma.organization.findFirst.mockResolvedValue({ id: 2n });
    prisma.user.findFirst.mockResolvedValue({ id: 9n });
    prisma.membership.findFirst.mockResolvedValue(null);
    prisma.membership.create.mockResolvedValue({
      id: 1n,
      organizationId: 2n,
      userId: 9n,
    });

    const result = await service.attachUser(2n, 9n);
    expect(result.organizationId).toBe(2n);
    expect(result.userId).toBe(9n);
  });

  it('does not allow duplicate active membership', async () => {
    prisma.organization.findFirst.mockResolvedValue({ id: 2n });
    prisma.user.findFirst.mockResolvedValue({ id: 9n });
    prisma.membership.findFirst.mockResolvedValue({
      id: 1n,
      deletedAt: null,
    });

    await expect(service.attachUser(2n, 9n)).rejects.toThrow(
      'Already a member',
    );
  });

  it('reactivates a soft deleted membership', async () => {
    prisma.organization.findFirst.mockResolvedValue({ id: 2n });
    prisma.user.findFirst.mockResolvedValue({ id: 9n });
    prisma.membership.findFirst.mockResolvedValue({
      id: 1n,
      deletedAt: new Date().toISOString(),
    });
    prisma.membership.update.mockResolvedValue({
      id: 1n,
      organizationId: 2n,
      userId: 9n,
      deletedAt: null,
    });

    const result = await service.attachUser(2n, 9n);

    expect(prisma.membership.update).toHaveBeenCalledWith({
      where: { id: 1n },
      data: { deletedAt: null },
    });
    expect(result.deletedAt).toBeNull();
  });

  it('maps unique constraint races to duplicate membership errors', async () => {
    prisma.organization.findFirst.mockResolvedValue({ id: 2n });
    prisma.user.findFirst.mockResolvedValue({ id: 9n });
    prisma.membership.findFirst.mockResolvedValue(null);
    prisma.membership.create.mockRejectedValue({ code: 'P2002' });

    await expect(service.attachUser(2n, 9n)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('blocks detaching last membership', async () => {
    prisma.membership.findFirst.mockResolvedValue({
      id: 1n,
      userId: 9n,
      organizationId: 2n,
    });
    prisma.membership.count.mockResolvedValue(1);

    await expect(service.detachUser(2n, 9n)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws not found when membership does not exist', async () => {
    prisma.membership.findFirst.mockResolvedValue(null);
    await expect(service.detachUser(2n, 9n)).rejects.toThrow(NotFoundException);
  });

  it('changes role for active membership', async () => {
    prisma.membership.findFirst.mockResolvedValue({ id: 1n });
    prisma.membership.update.mockResolvedValue({
      id: 1n,
      role: 'admin',
    });

    const result = await service.changeRole(2n, 9n, 'admin');

    expect(prisma.membership.update).toHaveBeenCalledWith({
      where: { id: 1n },
      data: { role: 'admin' },
    });
    expect(result.role).toBe('admin');
  });

  it('does not create membership for deleted user', async () => {
    prisma.organization.findFirst.mockResolvedValue({ id: 2n });
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(service.attachUser(2n, 9n)).rejects.toThrow(NotFoundException);
  });

  it('does not create membership for deleted organization', async () => {
    prisma.organization.findFirst.mockResolvedValue(null);

    await expect(service.attachUser(2n, 9n)).rejects.toThrow(NotFoundException);
  });
});
