import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PermissionsService } from './permissions.service';

describe('PermissionsService', () => {
  const prisma = {
    permission: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  let service: PermissionsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new PermissionsService(prisma as never);
  });

  it('creates permissions', async () => {
    prisma.permission.create.mockResolvedValue({
      id: 1n,
      key: 'catalog.manage',
    });

    await service.create({ key: 'catalog.manage' });

    expect(prisma.permission.create).toHaveBeenCalledWith({
      data: { key: 'catalog.manage' },
    });
  });

  it('maps duplicate keys to bad request', async () => {
    prisma.permission.create.mockRejectedValue({ code: 'P2002' });

    await expect(service.create({ key: 'catalog.manage' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws when permission is missing', async () => {
    prisma.permission.findUnique.mockResolvedValue(null);

    await expect(service.findOne(1n)).rejects.toThrow(NotFoundException);
  });

  it('updates permissions', async () => {
    prisma.permission.findUnique.mockResolvedValue({
      id: 1n,
      key: 'catalog.manage',
    });
    prisma.permission.update.mockResolvedValue({ id: 1n, key: 'catalog.view' });

    await service.update(1n, { key: 'catalog.view' });

    expect(prisma.permission.update).toHaveBeenCalledWith({
      where: { id: 1n },
      data: { key: 'catalog.view' },
    });
  });

  it('deletes permissions', async () => {
    prisma.permission.findUnique.mockResolvedValue({
      id: 1n,
      key: 'catalog.manage',
    });
    prisma.permission.delete.mockResolvedValue({ id: 1n });

    await service.remove(1n);

    expect(prisma.permission.delete).toHaveBeenCalledWith({
      where: { id: 1n },
    });
  });
});
