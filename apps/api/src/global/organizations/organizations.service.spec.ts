import { OrganizationsService } from './organizations.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('OrganizationsService', () => {
  const prisma = {
    organization: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    organizationUser: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    organizationInvitation: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: OrganizationsService;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation(
      (callback: (client: typeof prisma) => unknown) =>
        Promise.resolve(callback(prisma)),
    );
    service = new OrganizationsService(prisma as never);
  });

  it('creates an organization for an authenticated user and makes them owner', async () => {
    prisma.organization.create.mockResolvedValue({
      id: 2n,
      name: 'Acme',
      slug: 'acme',
    });
    prisma.organizationUser.create.mockResolvedValue({
      id: 4n,
    });

    const result = await service.createForUser(7n, {
      name: 'Acme',
      slug: 'acme',
    });

    expect(prisma.organization.create).toHaveBeenCalledWith({
      data: { name: 'Acme', slug: 'acme' },
    });
    expect(prisma.organizationUser.create).toHaveBeenCalledWith({
      data: {
        organizationId: 2n,
        userId: 7n,
        governanceRole: 'owner',
        status: 'active',
      },
    });
    expect(result.id).toBe(2n);
  });

  it('does not allow duplicate organization slug', async () => {
    prisma.organization.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.createForUser(7n, { name: 'Acme 2', slug: 'acme' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('soft deletes organization by setting deletedAt', async () => {
    prisma.organization.findFirst.mockResolvedValue({ id: 2n });
    prisma.organization.update.mockResolvedValue({
      id: 2n,
      name: 'Acme',
      slug: 'acme',
      deletedAt: new Date().toISOString(),
    });

    const result = await service.remove(2n);

    const updateMock = prisma.organization.update;
    const [updateArgs] = updateMock.mock.calls[0] as [
      { where: { id: bigint }; data: { deletedAt: Date } },
    ];
    expect(updateArgs.where.id).toBe(2n);
    expect(updateArgs.data.deletedAt).toBeInstanceOf(Date);
    expect(result.deletedAt).toBeDefined();
  });

  it('returns active organizations in findAll', async () => {
    prisma.organization.findMany.mockResolvedValue([
      { id: 1n, name: 'Acme', slug: 'acme' },
    ]);

    const result = await service.findAll();

    expect(prisma.organization.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({ id: 1n, name: 'Acme', slug: 'acme' }),
    );
  });

  it('returns organization in findOne when found', async () => {
    prisma.organization.findFirst.mockResolvedValue({
      id: 2n,
      name: 'Acme',
      slug: 'acme',
    });

    const result = await service.findOne(2n);

    expect(prisma.organization.findFirst).toHaveBeenCalledWith({
      where: { id: 2n, deletedAt: null },
    });
    expect(result.id).toBe(2n);
  });

  it('throws not found in findOne when organization is missing', async () => {
    prisma.organization.findFirst.mockResolvedValue(null);

    await expect(service.findOne(9n)).rejects.toThrow(NotFoundException);
  });

  it('updates organization after existence check', async () => {
    prisma.organization.findFirst.mockResolvedValue({
      id: 2n,
      name: 'Acme',
      slug: 'acme',
    });
    prisma.organization.update.mockResolvedValue({
      id: 2n,
      name: 'Acme 2',
      slug: 'acme-2',
    });

    const dto = { name: 'Acme 2', slug: 'acme-2' };
    const result = await service.update(2n, dto);

    expect(prisma.organization.update).toHaveBeenCalledWith({
      where: { id: 2n },
      data: dto,
    });
    expect(result.slug).toBe('acme-2');
  });
});
