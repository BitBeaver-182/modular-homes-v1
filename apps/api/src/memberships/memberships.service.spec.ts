import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MembershipsService } from './memberships.service';

describe('MembershipsService', () => {
  const prisma = {
    organization: {
      findFirst: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
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
      service.createUserWithMembership({ email: 'x@example.com' }),
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
});
