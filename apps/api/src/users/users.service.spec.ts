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
  const membershipsService = {
    createUserWithMembership: jest.fn(),
  };

  let service: UsersService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new UsersService(prisma as never, membershipsService as never);
  });

  it('delegates create to memberships service', async () => {
    membershipsService.createUserWithMembership.mockResolvedValue({
      id: 10n,
      email: 'user@example.com',
    });

    await service.create({ email: 'user@example.com', organizationId: '2' });

    expect(membershipsService.createUserWithMembership).toHaveBeenCalledWith({
      email: 'user@example.com',
      organizationId: '2',
    });
  });

  it('throws not found when user is missing', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(service.findOne(99n)).rejects.toThrow(NotFoundException);
  });

  it('propagates error when creating user without organization', async () => {
    membershipsService.createUserWithMembership.mockRejectedValue(
      new Error('User must belong to an organization'),
    );

    await expect(
      service.create({ email: 'test@test.com' } as never),
    ).rejects.toThrow('User must belong to an organization');
  });

  it('fails on duplicate email create', async () => {
    membershipsService.createUserWithMembership.mockRejectedValue(
      new Error('Unique constraint failed'),
    );

    await expect(
      service.create({ email: 'john@acme.com', organizationId: '2' }),
    ).rejects.toThrow();
  });

  it('soft deletes user by setting deletedAt', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 1n });
    prisma.user.update.mockResolvedValue({
      id: 1n,
      deletedAt: new Date().toISOString(),
    });

    const result = await service.remove(1n);

    const updateMock = prisma.user.update;
    const [updateArgs] = updateMock.mock.calls[0] as [
      { where: { id: bigint }; data: { deletedAt: Date } },
    ];
    expect(updateArgs.where.id).toBe(1n);
    expect(updateArgs.data.deletedAt).toBeInstanceOf(Date);
    expect(result.deletedAt).toBeDefined();
  });

  it('returns active users with active memberships in findAll', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 1n, memberships: [] }]);

    const result = await service.findAll();

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      include: { memberships: { where: { deletedAt: null } } },
    });
    expect(result).toHaveLength(1);
  });

  it('returns user in findOne when found', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 1n, memberships: [] });

    const result = await service.findOne(1n);

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: 1n, deletedAt: null },
      include: { memberships: { where: { deletedAt: null } } },
    });
    expect(result.id).toBe(1n);
  });

  it('updates user after existence check', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 1n, memberships: [] });
    prisma.user.update.mockResolvedValue({
      id: 1n,
      email: 'updated@example.com',
    });

    const dto = { email: 'updated@example.com', name: 'Updated' };
    const result = await service.update(1n, dto);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 1n },
      data: {
        email: 'updated@example.com',
        name: 'Updated',
        avatarUrl: undefined,
      },
    });
    expect(result.email).toBe('updated@example.com');
  });
});
