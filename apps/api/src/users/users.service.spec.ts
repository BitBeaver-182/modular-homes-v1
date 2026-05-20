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
});
