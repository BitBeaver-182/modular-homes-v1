import { OrganizationsService } from './organizations.service';

describe('OrganizationsService', () => {
  const prisma = {
    organization: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };
  const membershipsService = {
    attachUser: jest.fn(),
    detachUser: jest.fn(),
  };

  let service: OrganizationsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new OrganizationsService(
      prisma as never,
      membershipsService as never,
    );
  });

  it('delegates attach user to memberships service', async () => {
    membershipsService.attachUser.mockResolvedValue({
      id: 1n,
      organizationId: 2n,
      userId: 9n,
    });

    await service.attachUser(2n, 9n);

    expect(membershipsService.attachUser).toHaveBeenCalledWith(2n, 9n);
  });

  it('delegates detach user to memberships service', async () => {
    membershipsService.detachUser.mockResolvedValue({ id: 1n });

    await service.detachUser(2n, 9n);

    expect(membershipsService.detachUser).toHaveBeenCalledWith(2n, 9n);
  });

  it('does not allow duplicate organization slug', async () => {
    prisma.organization.create.mockRejectedValue(new Error('Unique failed'));

    await expect(
      service.create({ name: 'Acme 2', slug: 'acme' }),
    ).rejects.toThrow();
  });

  it('soft deletes organization by setting deletedAt', async () => {
    prisma.organization.findFirst.mockResolvedValue({ id: 2n });
    prisma.organization.update.mockResolvedValue({
      id: 2n,
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

  it('does not allow adding user to deleted organization', async () => {
    membershipsService.attachUser.mockRejectedValue(
      new Error('Organization is not active'),
    );

    await expect(service.attachUser(2n, 9n)).rejects.toThrow(
      'Organization is not active',
    );
  });
});
