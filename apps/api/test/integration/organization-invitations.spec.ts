import { ForbiddenException, INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/database/prisma.service';
import { OrganizationInvitationsService } from '../../src/platform/organization-invitations/organization-invitations.service';
import {
  createRealDbTestApp,
  truncateTestDatabase,
} from '../helpers/db-test-harness';

describe('OrganizationInvitationsService (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let invitationsService: OrganizationInvitationsService;

  beforeAll(async () => {
    const testApp = await createRealDbTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
    invitationsService = app.get(OrganizationInvitationsService);
  });

  beforeEach(async () => {
    await truncateTestDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a pending invitation without creating a membership', async () => {
    const organization = await prisma.organization.create({
      data: {
        name: 'Invitation Org',
        slug: 'invitation-org',
      },
    });

    const invitation = await invitationsService.createInvitation(
      organization.id,
      {
        email: 'invitee@example.com',
        governanceRole: 'member',
      },
    );

    expect(invitation.status).toBe('pending');
    await expect(
      prisma.organizationUser.findFirst({
        where: {
          organizationId: organization.id,
        },
      }),
    ).resolves.toBeNull();
  });

  it('accepts an invitation for the matching authenticated user', async () => {
    const organization = await prisma.organization.create({
      data: {
        name: 'Accept Org',
        slug: 'accept-org',
      },
    });
    const user = await prisma.user.create({
      data: { email: 'invitee@example.com' },
    });
    const invitation = await invitationsService.createInvitation(
      organization.id,
      {
        email: 'invitee@example.com',
        governanceRole: 'owner',
      },
    );

    await invitationsService.acceptInvitation(invitation.id, {
      userId: user.id,
      email: user.email,
    });

    const membership = await prisma.organizationUser.findUniqueOrThrow({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organization.id,
        },
      },
    });
    const acceptedInvitation =
      await prisma.organizationInvitation.findUniqueOrThrow({
        where: { id: invitation.id },
      });

    expect(membership.governanceRole).toBe('owner');
    expect(membership.status).toBe('active');
    expect(acceptedInvitation.status).toBe('accepted');
  });

  it('lists pending invitations for an email with organization details', async () => {
    const organization = await prisma.organization.create({
      data: {
        name: 'Inbox Org',
        slug: 'inbox-org',
      },
    });

    await invitationsService.createInvitation(organization.id, {
      email: 'invitee@example.com',
      governanceRole: 'member',
    });
    await invitationsService.createInvitation(organization.id, {
      email: 'other@example.com',
      governanceRole: 'owner',
    });

    const invitations = await invitationsService.findPendingInvitationsForEmail(
      'invitee@example.com',
    );

    expect(invitations).toHaveLength(1);
    expect(invitations[0]).toMatchObject({
      email: 'invitee@example.com',
      governanceRole: 'member',
      status: 'pending',
      organization: {
        id: organization.id,
        name: 'Inbox Org',
        slug: 'inbox-org',
      },
    });
  });

  it('rejects acceptance for a different authenticated email', async () => {
    const organization = await prisma.organization.create({
      data: {
        name: 'Mismatch Org',
        slug: 'mismatch-org',
      },
    });
    const user = await prisma.user.create({
      data: { email: 'other@example.com' },
    });
    const invitation = await invitationsService.createInvitation(
      organization.id,
      {
        email: 'invitee@example.com',
        governanceRole: 'member',
      },
    );

    await expect(
      invitationsService.acceptInvitation(invitation.id, {
        userId: user.id,
        email: user.email,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects an invitation and removes it from pending invitations', async () => {
    const organization = await prisma.organization.create({
      data: {
        name: 'Reject Org',
        slug: 'reject-org',
      },
    });
    const user = await prisma.user.create({
      data: { email: 'invitee@example.com' },
    });
    const invitation = await invitationsService.createInvitation(
      organization.id,
      {
        email: 'invitee@example.com',
        governanceRole: 'member',
      },
    );

    await invitationsService.rejectInvitation(invitation.id, {
      userId: user.id,
      email: user.email,
    });

    const rejectedInvitation =
      await prisma.organizationInvitation.findUniqueOrThrow({
        where: { id: invitation.id },
      });
    const memberships = await prisma.organizationUser.findMany({
      where: {
        organizationId: organization.id,
      },
    });
    const pendingInvitations =
      await invitationsService.findPendingInvitationsForEmail(user.email);

    expect(rejectedInvitation.status).toBe('rejected');
    expect(rejectedInvitation.rejectedAt).toBeInstanceOf(Date);
    expect(rejectedInvitation.deletedAt).toBeInstanceOf(Date);
    expect(memberships).toHaveLength(0);
    expect(pendingInvitations).toHaveLength(0);
  });
});
