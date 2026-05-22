import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RolesService } from './roles.service';

describe('RolesService', () => {
  const prisma = {
    role: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  let service: RolesService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new RolesService(prisma as never);
  });

  it('creates roles scoped to an organization', async () => {
    prisma.role.create.mockResolvedValue({ id: 1n, name: 'Admin' });

    await service.create(2n, { name: 'Admin', description: 'Admin role' });

    expect(prisma.role.create).toHaveBeenCalledWith({
      data: {
        organizationId: 2n,
        name: 'Admin',
        description: 'Admin role',
      },
    });
  });

  it('maps duplicate names to bad request', async () => {
    prisma.role.create.mockRejectedValue({ code: 'P2002' });

    await expect(service.create(2n, { name: 'Admin' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('lists org roles', async () => {
    prisma.role.findMany.mockResolvedValue([]);

    await service.findAll(2n);

    expect(prisma.role.findMany).toHaveBeenCalledWith({
      where: { organizationId: 2n },
      orderBy: { id: 'asc' },
    });
  });

  it('throws when role is missing', async () => {
    prisma.role.findFirst.mockResolvedValue(null);

    await expect(service.findOne(2n, 1n)).rejects.toThrow(NotFoundException);
  });

  it('updates a role after verifying scope', async () => {
    prisma.role.findFirst.mockResolvedValue({ id: 1n });
    prisma.role.update.mockResolvedValue({ id: 1n, name: 'Lead' });

    await service.update(2n, 1n, { name: 'Lead' });

    expect(prisma.role.update).toHaveBeenCalledWith({
      where: { id: 1n },
      data: {
        name: 'Lead',
        description: undefined,
      },
    });
  });

  it('deletes a role after verifying scope', async () => {
    prisma.role.findFirst.mockResolvedValue({ id: 1n });
    prisma.role.delete.mockResolvedValue({ id: 1n });

    await service.remove(2n, 1n);

    expect(prisma.role.delete).toHaveBeenCalledWith({
      where: { id: 1n },
    });
  });
});
