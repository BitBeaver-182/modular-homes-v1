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
});
