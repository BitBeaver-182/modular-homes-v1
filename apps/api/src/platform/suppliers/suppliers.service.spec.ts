import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';

interface PrismaMock {
  $transaction: jest.Mock;
  address: {
    create: jest.Mock;
    update: jest.Mock;
  };
  supplier: {
    count: jest.Mock;
    create: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
  };
}

describe('SuppliersService', () => {
  const prisma: PrismaMock = {
    $transaction: jest.fn(),
    address: {
      create: jest.fn(),
      update: jest.fn(),
    },
    supplier: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };
  const querybuilder = {
    query: jest.fn(),
  };

  let service: SuppliersService;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation(
      (callback: (client: PrismaMock) => unknown) => callback(prisma),
    );
    service = new SuppliersService(prisma as never, querybuilder as never);
    querybuilder.query.mockResolvedValue({
      orderBy: { name: 'asc' },
      skip: 0,
      take: 15,
    });
  });

  it('creates suppliers scoped to an organization and normalizes blanks', async () => {
    prisma.supplier.findFirst.mockResolvedValue(null);
    prisma.supplier.create.mockResolvedValue({ id: 1n });
    prisma.address.create.mockResolvedValue({ id: 10n });

    await service.create(2n, {
      name: '  Acme Supply  ',
      phoneNumber: '   ',
      email: ' orders@example.com ',
      address: {
        line1: ' 100 Main Street ',
        line2: '',
        city: ' Austin ',
        region: ' TX ',
        postalCode: ' 78701 ',
        countryCode: ' us ',
      },
      website: ' https://example.com ',
    });

    expect(prisma.address.create).toHaveBeenCalledWith({
      data: {
        organizationId: 2n,
        line1: '100 Main Street',
        line2: null,
        city: 'Austin',
        region: 'TX',
        postalCode: '78701',
        countryCode: 'US',
      },
    });
    expect(prisma.supplier.create).toHaveBeenCalledWith({
      data: {
        organizationId: 2n,
        addressId: 10n,
        name: 'Acme Supply',
        phoneNumber: null,
        email: 'orders@example.com',
        website: 'https://example.com',
      },
      include: { address: true },
    });
  });

  it('rejects duplicate active supplier names inside an organization', async () => {
    prisma.supplier.findFirst.mockResolvedValue({ id: 1n });

    await expect(service.create(2n, { name: 'Acme Supply' })).rejects.toThrow(
      BadRequestException,
    );

    expect(prisma.supplier.create).not.toHaveBeenCalled();
  });

  it('lists suppliers with mandatory organization and deleted scopes', async () => {
    prisma.supplier.findMany.mockResolvedValue([{ id: 1n }]);
    prisma.supplier.count.mockResolvedValue(1);

    await service.findAll(2n, {
      page: '1',
      limit: '15',
      search: 'acme',
      sort: { field: 'name', criteria: 'asc' },
    });

    expect(querybuilder.query).toHaveBeenCalledWith({
      model: 'supplier',
      paginationOnly: true,
      setHeaders: false,
    });
    expect(prisma.supplier.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: 2n,
        deletedAt: null,
        OR: [
          { name: { contains: 'acme', mode: 'insensitive' } },
          { email: { contains: 'acme', mode: 'insensitive' } },
          { phoneNumber: { contains: 'acme', mode: 'insensitive' } },
          { website: { contains: 'acme', mode: 'insensitive' } },
          {
            address: {
              is: {
                deletedAt: null,
                OR: [
                  { line1: { contains: 'acme', mode: 'insensitive' } },
                  { line2: { contains: 'acme', mode: 'insensitive' } },
                  { city: { contains: 'acme', mode: 'insensitive' } },
                  { region: { contains: 'acme', mode: 'insensitive' } },
                  { postalCode: { contains: 'acme', mode: 'insensitive' } },
                  { countryCode: { contains: 'acme', mode: 'insensitive' } },
                ],
              },
            },
          },
        ],
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      skip: 0,
      take: 15,
      include: { address: true },
    });
    expect(prisma.supplier.count).toHaveBeenCalledWith({
      // Jest asymmetric matchers are typed as any.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where: expect.objectContaining({
        organizationId: 2n,
        deletedAt: null,
      }),
    });
  });

  it('rejects unsupported query controls before Prisma receives them', async () => {
    await expect(service.findAll(2n, { select: 'all' })).rejects.toThrow(
      BadRequestException,
    );
    await expect(
      service.findAll(2n, { populate: 'organization' }),
    ).rejects.toThrow(BadRequestException);
    await expect(service.findAll(2n, { organizationId: '3' })).rejects.toThrow(
      BadRequestException,
    );

    expect(prisma.supplier.findMany).not.toHaveBeenCalled();
  });

  it('rejects unsupported sort fields', async () => {
    await expect(
      service.findAll(2n, {
        sort: { field: 'deletedAt', criteria: 'asc' },
      }),
    ).rejects.toThrow(BadRequestException);

    querybuilder.query.mockResolvedValue({
      orderBy: { organizationId: 'asc' },
      skip: 0,
      take: 15,
    });

    await expect(
      service.findAll(2n, {
        sort: { field: 'name', criteria: 'asc' },
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('finds one supplier only inside the active organization', async () => {
    prisma.supplier.findFirst.mockResolvedValue(null);

    await expect(service.findOne(2n, 1n)).rejects.toThrow(NotFoundException);
    expect(prisma.supplier.findFirst).toHaveBeenCalledWith({
      where: {
        id: 1n,
        organizationId: 2n,
        deletedAt: null,
      },
      include: { address: true },
    });
  });

  it('soft-deletes scoped suppliers', async () => {
    prisma.supplier.findFirst.mockResolvedValue({ id: 1n });
    prisma.supplier.update.mockResolvedValue({ id: 1n });

    await service.remove(2n, 1n);

    expect(prisma.supplier.update).toHaveBeenCalledWith({
      where: { id: 1n },
      // Jest asymmetric matchers are typed as any.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: { deletedAt: expect.any(Date) },
    });
  });
});
