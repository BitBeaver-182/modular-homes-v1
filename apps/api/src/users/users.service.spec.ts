import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

describe('UsersService membership invariants', () => {
  const prisma = {
    organization: {
      findFirst: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    membership: {
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: UsersService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new UsersService(prisma as never);
  });

  it('fails to create a user without organizationId', async () => {
    await expect(
      service.create({
        email: 'user@example.com',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates a user and membership when organizationId is provided', async () => {
    prisma.organization.findFirst.mockResolvedValue({ id: 2n });
    prisma.$transaction.mockResolvedValue({
      id: 10n,
      email: 'user@example.com',
      memberships: [{ id: 1n, organizationId: 2n }],
    });

    const result = await service.create({
      email: 'user@example.com',
      organizationId: 2n,
    });

    expect(result.email).toBe('user@example.com');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('blocks removing a user membership when it is the last one', async () => {
    prisma.membership.findFirst.mockResolvedValue({
      id: 99n,
      userId: 10n,
      organizationId: 2n,
      deletedAt: null,
    });
    prisma.membership.count.mockResolvedValue(1);

    await expect(service.detachFromOrganization(10n, 2n)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws not found when detach membership does not exist', async () => {
    prisma.membership.findFirst.mockResolvedValue(null);

    await expect(service.detachFromOrganization(10n, 2n)).rejects.toThrow(
      NotFoundException,
    );
  });
});
