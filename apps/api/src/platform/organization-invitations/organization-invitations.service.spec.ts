import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationInvitationsService } from './organization-invitations.service';

describe('OrganizationInvitationsService', () => {
  const prisma = {
    organizationInvitation: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    organizationUser: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: OrganizationInvitationsService;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation(
      (callback: (client: typeof prisma) => unknown) =>
        Promise.resolve(callback(prisma)),
    );
    service = new OrganizationInvitationsService(prisma as never);
  });

  it('creates a pending invitation without creating a membership', async () => {
    prisma.organizationInvitation.findFirst.mockResolvedValue(null);
    prisma.organizationInvitation.create.mockResolvedValue({
      id: 1n,
      organizationId: 2n,
      email: 'invitee@example.com',
      governanceRole: 'member',
      status: 'pending',
    });

    const invitation = await service.createInvitation(2n, {
      email: 'invitee@example.com',
      governanceRole: 'member',
    });

    expect(prisma.organizationInvitation.create).toHaveBeenCalledWith({
      data: {
        organizationId: 2n,
        email: 'invitee@example.com',
        governanceRole: 'member',
        status: 'pending',
      },
    });
    expect(invitation.status).toBe('pending');
    expect(prisma.organizationUser.create).not.toHaveBeenCalled();
  });

  it('lists pending invitations for the authenticated email', async () => {
    prisma.organizationInvitation.findMany.mockResolvedValue([
      {
        id: 1n,
        organizationId: 2n,
        email: 'invitee@example.com',
        governanceRole: 'member',
        status: 'pending',
        organization: {
          id: 2n,
          name: 'Acme',
          slug: 'acme',
        },
      },
    ]);

    const invitations = await service.findPendingInvitationsForEmail(
      'invitee@example.com',
    );

    const findManyArgs = prisma.organizationInvitation.findMany.mock
      .calls[0] as unknown as [
      {
        where: {
          email: string;
          status: string;
          deletedAt: null;
          OR: Array<{ expiresAt: null | { gt: Date } }>;
        };
        include: {
          organization: {
            select: {
              id: true;
              name: true;
              slug: true;
            };
          };
        };
        orderBy: Array<{ id: string }>;
      },
    ];

    expect(findManyArgs[0].where.email).toBe('invitee@example.com');
    expect(findManyArgs[0].where.status).toBe('pending');
    expect(findManyArgs[0].where.deletedAt).toBeNull();
    expect(findManyArgs[0].where.OR[0]?.expiresAt).toBeNull();
    const expiryFilter = findManyArgs[0].where.OR[1]?.expiresAt;
    expect(expiryFilter).toBeDefined();
    if (expiryFilter && 'gt' in expiryFilter) {
      expect(expiryFilter.gt).toBeInstanceOf(Date);
    }
    expect(findManyArgs[0].include.organization.select).toEqual({
      id: true,
      name: true,
      slug: true,
    });
    expect(findManyArgs[0].orderBy).toEqual([{ id: 'desc' }]);
    expect(invitations).toHaveLength(1);
    expect(invitations[0]?.organization.name).toBe('Acme');
  });

  it('rejects duplicate pending invitations for the same org and email', async () => {
    prisma.organizationInvitation.findFirst.mockResolvedValue({ id: 1n });

    await expect(
      service.createInvitation(2n, {
        email: 'invitee@example.com',
        governanceRole: 'member',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('accepts a valid invitation for the authenticated user and creates a membership', async () => {
    prisma.organizationInvitation.findUnique.mockResolvedValue({
      id: 1n,
      organizationId: 2n,
      email: 'invitee@example.com',
      governanceRole: 'owner',
      status: 'pending',
      expiresAt: null,
      deletedAt: null,
    });
    prisma.organizationUser.findUnique.mockResolvedValue(null);
    prisma.organizationUser.create.mockResolvedValue({
      id: 3n,
      organizationId: 2n,
      userId: 9n,
      governanceRole: 'owner',
      status: 'active',
    });
    prisma.organizationInvitation.update.mockResolvedValue({
      id: 1n,
      status: 'accepted',
    });

    await service.acceptInvitation(1n, {
      userId: 9n,
      email: 'invitee@example.com',
    });

    expect(prisma.organizationUser.create).toHaveBeenCalledWith({
      data: {
        organizationId: 2n,
        userId: 9n,
        governanceRole: 'owner',
        status: 'active',
      },
    });
    const invitationUpdateArgs = prisma.organizationInvitation.update.mock
      .calls[0] as unknown as [
      {
        where: { id: bigint };
        data: { status: string; acceptedAt: Date; deletedAt: Date };
      },
    ];
    expect(invitationUpdateArgs[0].where.id).toBe(1n);
    expect(invitationUpdateArgs[0].data.status).toBe('accepted');
    expect(invitationUpdateArgs[0].data.acceptedAt).toBeInstanceOf(Date);
    expect(invitationUpdateArgs[0].data.deletedAt).toBeInstanceOf(Date);
  });

  it('rejects accepting an invitation for a different email', async () => {
    prisma.organizationInvitation.findUnique.mockResolvedValue({
      id: 1n,
      organizationId: 2n,
      email: 'invitee@example.com',
      governanceRole: 'member',
      status: 'pending',
      expiresAt: null,
      deletedAt: null,
    });

    await expect(
      service.acceptInvitation(1n, {
        userId: 9n,
        email: 'other@example.com',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('does not create duplicate memberships when accepting an invitation', async () => {
    prisma.organizationInvitation.findUnique.mockResolvedValue({
      id: 1n,
      organizationId: 2n,
      email: 'invitee@example.com',
      governanceRole: 'member',
      status: 'pending',
      expiresAt: null,
      deletedAt: null,
    });
    prisma.organizationUser.findUnique.mockResolvedValue({
      id: 3n,
      deletedAt: null,
    });

    await expect(
      service.acceptInvitation(1n, {
        userId: 9n,
        email: 'invitee@example.com',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws when invitation is missing or not pending', async () => {
    prisma.organizationInvitation.findUnique.mockResolvedValue(null);

    await expect(
      service.acceptInvitation(1n, {
        userId: 9n,
        email: 'invitee@example.com',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
