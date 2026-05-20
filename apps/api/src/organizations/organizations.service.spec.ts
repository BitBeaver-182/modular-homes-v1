import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsService membership operations', () => {
  const prisma = {
    organization: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
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
  };

  let service: OrganizationsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new OrganizationsService(prisma as never);
  });

  it('attaches a user to an organization', async () => {
    prisma.organization.findFirst.mockResolvedValue({ id: 2n });
    prisma.user.findFirst.mockResolvedValue({ id: 9n });
    prisma.membership.findFirst.mockResolvedValue(null);
    prisma.membership.create.mockResolvedValue({
      id: 99n,
      userId: 9n,
      organizationId: 2n,
    });

    const result = await service.attachUser(2n, 9n);

    expect(result.organizationId).toBe(2n);
    expect(result.userId).toBe(9n);
  });

  it('detaches a user from an organization', async () => {
    prisma.membership.findFirst.mockResolvedValueOnce({
      id: 99n,
      userId: 9n,
      organizationId: 2n,
      deletedAt: null,
    });
    prisma.membership.count.mockResolvedValue(2);
    prisma.membership.update.mockResolvedValue({
      id: 99n,
      deletedAt: new Date(),
    });

    await expect(service.detachUser(2n, 9n)).resolves.toBeDefined();
  });

  it('blocks detaching when this is the last membership', async () => {
    prisma.membership.findFirst.mockResolvedValue({
      id: 99n,
      userId: 9n,
      organizationId: 2n,
      deletedAt: null,
    });
    prisma.membership.count.mockResolvedValue(1);

    await expect(service.detachUser(2n, 9n)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws when a user does not belong to organization', async () => {
    prisma.membership.findFirst.mockResolvedValue(null);

    await expect(
      service.assertUserBelongsToOrganization(2n, 9n),
    ).rejects.toThrow(NotFoundException);
  });
});
