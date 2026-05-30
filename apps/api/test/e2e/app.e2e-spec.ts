import { HttpStatus, INestApplication } from '@nestjs/common';
import type {
  OrganizationResponse,
  PermissionResponse,
  RoleResponse,
  UserResponse,
} from '@moduflow/types';
import { Server } from 'node:http';
import request, { Response } from 'supertest';
import { PrismaService } from '../../src/database/prisma.service';
import {
  createRealDbTestApp,
  truncateTestDatabase,
} from '../helpers/db-test-harness';

describe('API (e2e)', () => {
  const testPassword = 'password-123';
  let app: INestApplication;
  let httpServer: Server;
  let prisma: PrismaService;

  beforeAll(async () => {
    const testApp = await createRealDbTestApp();
    app = testApp.app;
    httpServer = app.getHttpServer() as Server;
    prisma = testApp.prisma;
  });

  beforeEach(async () => {
    await truncateTestDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('verifies system health', async () => {
    await request(httpServer)
      .get('/api/health')
      .expect(HttpStatus.OK)
      .expect((res: Response) => {
        const body = res.body as { status: string };
        expect(body.status).toBe('ok');
      });
  });

  it('requires x-organization-id for platform-managed routes', async () => {
    await request(httpServer).get('/api/users').expect(HttpStatus.BAD_REQUEST);

    await request(httpServer).get('/api/roles').expect(HttpStatus.BAD_REQUEST);

    await request(httpServer)
      .get('/api/permissions')
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('rejects malformed and unknown organization headers', async () => {
    await request(httpServer)
      .get('/api/users')
      .set('x-organization-id', 'abc')
      .expect(HttpStatus.BAD_REQUEST);

    await request(httpServer)
      .get('/api/users')
      .set('x-organization-id', '9999')
      .expect(HttpStatus.NOT_FOUND);
  });

  it('serializes organization responses without internal fields', async () => {
    const organization = await createOrganization('acme', 'Acme Corp');

    const fetchedOrganization = expectOrganizationResponse(
      (
        await request(httpServer)
          .get(`/api/organizations/${organization.id}`)
          .expect(HttpStatus.OK)
      ).body,
    );
    expect(fetchedOrganization.id).toBe(organization.id);

    const organizationsRes = await request(httpServer)
      .get('/api/organizations')
      .expect(HttpStatus.OK);
    const organizations = organizationsRes.body as Array<
      Pick<OrganizationResponse, 'id' | 'name' | 'slug'>
    >;
    expect(organizations).toHaveLength(1);
    expect(organizations[0]?.id).toBe(organization.id);
    expectHiddenFieldIsAbsent(organizations[0], 'deletedAt');
  });

  it('registers a user and lets them create an owned organization', async () => {
    const registration = (
      await request(httpServer)
        .post('/api/auth/register')
        .send({
          email: 'signup-owner@example.com',
          password: testPassword,
          name: 'Signup Owner',
        })
        .expect(HttpStatus.CREATED)
    ).body as {
      access_token: string;
      user: { id: string; email: string; name: string | null };
    };

    expect(registration.user.email).toBe('signup-owner@example.com');
    expect(registration.access_token).toEqual(expect.any(String));

    await request(httpServer)
      .post('/api/auth/token')
      .send({ email: 'signup-owner@example.com' })
      .expect(HttpStatus.BAD_REQUEST);

    const login = (
      await request(httpServer)
        .post('/api/auth/login')
        .send({
          email: 'signup-owner@example.com',
          password: testPassword,
        })
        .expect(HttpStatus.OK)
    ).body as {
      access_token: string;
      user: { id: string; email: string };
    };
    expect(login.user.id).toBe(registration.user.id);
    expect(login.access_token).toEqual(expect.any(String));

    const organization = expectOrganizationResponse(
      (
        await request(httpServer)
          .post('/api/organizations')
          .set('authorization', `Bearer ${registration.access_token}`)
          .send({ name: 'Signup Org', slug: 'signup-org' })
          .expect(HttpStatus.CREATED)
      ).body,
    );

    const membership = await prisma.organizationUser.findUniqueOrThrow({
      where: {
        userId_organizationId: {
          userId: BigInt(registration.user.id),
          organizationId: BigInt(organization.id),
        },
      },
    });

    expect(membership.governanceRole).toBe('owner');
    expect(membership.status).toBe('active');

    const session = (
      await request(httpServer)
        .get('/api/auth/session')
        .set('authorization', `Bearer ${registration.access_token}`)
        .expect(HttpStatus.OK)
    ).body as {
      user: { id: string; email: string };
      memberships: Array<{
        id: string;
        governanceRole: string;
        organization: { id: string; name: string; slug: string };
      }>;
    };

    expect(session.user.id).toBe(registration.user.id);
    expect(session.memberships).toEqual([
      {
        id: membership.id.toString(),
        governanceRole: 'owner',
        organization: {
          id: organization.id,
          name: 'Signup Org',
          slug: 'signup-org',
        },
      },
    ]);
  });

  it('allows an owner to delete an organization and rejects non-owners', async () => {
    const organization = await createOrganization(
      'deletable-org',
      'Deletable Org',
    );

    const memberRegistration = (
      await request(httpServer)
        .post('/api/auth/register')
        .send({
          email: 'org-member@example.com',
          password: testPassword,
          name: 'Org Member',
        })
        .expect(HttpStatus.CREATED)
    ).body as {
      access_token: string;
      user: { id: string; email: string; name: string | null };
    };

    const member = expectUserResponse(
      (
        await request(httpServer)
          .post('/api/users')
          .set('x-organization-id', organization.id)
          .send({ email: memberRegistration.user.email })
          .expect(HttpStatus.CREATED)
      ).body,
    );
    expect(member.id).toBe(memberRegistration.user.id);

    await request(httpServer)
      .delete(`/api/organizations/${organization.id}`)
      .set('authorization', `Bearer ${memberRegistration.access_token}`)
      .expect(HttpStatus.BAD_REQUEST);

    await request(httpServer)
      .delete(`/api/organizations/${organization.id}`)
      .set('authorization', `Bearer ${organization.ownerToken}`)
      .expect(HttpStatus.OK);

    await request(httpServer)
      .get(`/api/organizations/${organization.id}`)
      .expect(HttpStatus.NOT_FOUND);
  });

  it('creates, lists, updates, and removes org-scoped users', async () => {
    const organizationA = await createOrganization('client-a', 'Client A');
    const organizationB = await createOrganization('client-b', 'Client B');

    const createdUser = expectUserResponse(
      (
        await request(httpServer)
          .post('/api/users')
          .set('x-organization-id', organizationA.id)
          .send({
            email: 'tenant.user@example.com',
            name: 'Tenant User',
          })
          .expect(HttpStatus.CREATED)
      ).body,
    );

    expect(createdUser.organization?.id).toBe(organizationA.id);
    expect(createdUser.roles).toEqual([]);

    const listedUsers = (
      await request(httpServer)
        .get('/api/users')
        .set('x-organization-id', organizationA.id)
        .expect(HttpStatus.OK)
    ).body as UserResponse[];
    expect(listedUsers).toHaveLength(2);
    expect(
      listedUsers.filter((user) => user.organization?.id === organizationA.id),
    ).toHaveLength(2);

    await request(httpServer)
      .get(`/api/users/${createdUser.id}`)
      .set('x-organization-id', organizationB.id)
      .expect(HttpStatus.NOT_FOUND);

    const updatedUser = expectUserResponse(
      (
        await request(httpServer)
          .patch(`/api/users/${createdUser.id}`)
          .set('x-organization-id', organizationA.id)
          .send({ name: 'Renamed User' })
          .expect(HttpStatus.OK)
      ).body,
    );
    expect(updatedUser.name).toBe('Renamed User');

    await request(httpServer)
      .delete(`/api/users/${createdUser.id}`)
      .set('x-organization-id', organizationA.id)
      .expect(HttpStatus.NO_CONTENT);
  });

  it('reuses the same user across organizations and keeps role responses isolated by header', async () => {
    const organizationA = await createOrganization('scope-a', 'Scope A');
    const organizationB = await createOrganization('scope-b', 'Scope B');

    const createdUserA = expectUserResponse(
      (
        await request(httpServer)
          .post('/api/users')
          .set('x-organization-id', organizationA.id)
          .send({ email: 'shared@example.com', name: 'Shared User' })
          .expect(HttpStatus.CREATED)
      ).body,
    );
    const createdUserB = expectUserResponse(
      (
        await request(httpServer)
          .post('/api/users')
          .set('x-organization-id', organizationB.id)
          .send({ email: 'shared@example.com' })
          .expect(HttpStatus.CREATED)
      ).body,
    );
    expect(createdUserB.id).toBe(createdUserA.id);

    const roleA = expectRoleResponse(
      (
        await request(httpServer)
          .post('/api/roles')
          .set('x-organization-id', organizationA.id)
          .send({ name: 'Estimator' })
          .expect(HttpStatus.CREATED)
      ).body,
    );
    const roleB = expectRoleResponse(
      (
        await request(httpServer)
          .post('/api/roles')
          .set('x-organization-id', organizationB.id)
          .send({ name: 'Sales' })
          .expect(HttpStatus.CREATED)
      ).body,
    );

    await request(httpServer)
      .post(`/api/users/${createdUserA.id}/roles`)
      .set('x-organization-id', organizationA.id)
      .send({ roleId: roleA.id })
      .expect(HttpStatus.CREATED);

    await request(httpServer)
      .post(`/api/users/${createdUserA.id}/roles`)
      .set('x-organization-id', organizationB.id)
      .send({ roleId: roleB.id })
      .expect(HttpStatus.CREATED);

    const scopedUserA = expectUserResponse(
      (
        await request(httpServer)
          .get(`/api/users/${createdUserA.id}`)
          .set('x-organization-id', organizationA.id)
          .expect(HttpStatus.OK)
      ).body,
    );
    const scopedUserB = expectUserResponse(
      (
        await request(httpServer)
          .get(`/api/users/${createdUserA.id}`)
          .set('x-organization-id', organizationB.id)
          .expect(HttpStatus.OK)
      ).body,
    );

    expect(scopedUserA.roles.map((role) => role.name)).toEqual(['Estimator']);
    expect(scopedUserB.roles.map((role) => role.name)).toEqual(['Sales']);
  });

  it('reactivates a soft-deleted org-user link on recreate', async () => {
    const organizationA = await createOrganization('react-a', 'React A');
    const organizationB = await createOrganization('react-b', 'React B');

    const user = expectUserResponse(
      (
        await request(httpServer)
          .post('/api/users')
          .set('x-organization-id', organizationA.id)
          .send({ email: 'reactivate@example.com' })
          .expect(HttpStatus.CREATED)
      ).body,
    );

    await request(httpServer)
      .post('/api/users')
      .set('x-organization-id', organizationB.id)
      .send({ email: 'reactivate@example.com' })
      .expect(HttpStatus.CREATED);

    const backupOwner = expectUserResponse(
      (
        await request(httpServer)
          .post('/api/users')
          .set('x-organization-id', organizationA.id)
          .send({ email: 'reactivate-owner@example.com' })
          .expect(HttpStatus.CREATED)
      ).body,
    );
    await prisma.organizationUser.update({
      where: {
        userId_organizationId: {
          userId: BigInt(backupOwner.id),
          organizationId: BigInt(organizationA.id),
        },
      },
      data: {
        governanceRole: 'owner',
      },
    });

    await request(httpServer)
      .delete(`/api/users/${user.id}`)
      .set('x-organization-id', organizationA.id)
      .expect(HttpStatus.NO_CONTENT);

    await request(httpServer)
      .post('/api/users')
      .set('x-organization-id', organizationA.id)
      .send({ email: 'reactivate@example.com', name: 'Back Again' })
      .expect(HttpStatus.CREATED)
      .expect((res: Response) => {
        const reactivatedUser = expectUserResponse(res.body);
        expect(reactivatedUser.id).toBe(user.id);
        expect(reactivatedUser.organization?.id).toBe(organizationA.id);
      });
  });

  it('removing a membership only removes the user from that organization', async () => {
    const organizationA = await createOrganization('member-a', 'Member A');
    const organizationB = await createOrganization('member-b', 'Member B');

    const createdUser = expectUserResponse(
      (
        await request(httpServer)
          .post('/api/users')
          .set('x-organization-id', organizationA.id)
          .send({ email: 'membership-only@example.com', name: 'Shared Member' })
          .expect(HttpStatus.CREATED)
      ).body,
    );

    await request(httpServer)
      .post('/api/users')
      .set('x-organization-id', organizationB.id)
      .send({ email: 'membership-only@example.com' })
      .expect(HttpStatus.CREATED);

    const backupOwner = expectUserResponse(
      (
        await request(httpServer)
          .post('/api/users')
          .set('x-organization-id', organizationA.id)
          .send({ email: 'membership-owner@example.com' })
          .expect(HttpStatus.CREATED)
      ).body,
    );
    await prisma.organizationUser.update({
      where: {
        userId_organizationId: {
          userId: BigInt(backupOwner.id),
          organizationId: BigInt(organizationA.id),
        },
      },
      data: {
        governanceRole: 'owner',
      },
    });

    await request(httpServer)
      .delete(`/api/users/${createdUser.id}`)
      .set('x-organization-id', organizationA.id)
      .expect(HttpStatus.NO_CONTENT);

    await request(httpServer)
      .get(`/api/users/${createdUser.id}`)
      .set('x-organization-id', organizationA.id)
      .expect(HttpStatus.NOT_FOUND);

    await request(httpServer)
      .get(`/api/users/${createdUser.id}`)
      .set('x-organization-id', organizationB.id)
      .expect(HttpStatus.OK);

    const persistedUser = await prisma.user.findUniqueOrThrow({
      where: { id: BigInt(createdUser.id) },
    });
    expect(persistedUser.deletedAt).toBeNull();
  });

  it('blocks deleting the last active owner from the organization', async () => {
    const organization = await createOrganization('solo-owner', 'Solo Owner');

    await request(httpServer)
      .delete(`/api/users/${organization.owner.id}`)
      .set('x-organization-id', organization.id)
      .expect(HttpStatus.BAD_REQUEST);

    await request(httpServer)
      .get(`/api/users/${organization.owner.id}`)
      .set('x-organization-id', organization.id)
      .expect(HttpStatus.OK);
  });

  it('allows deleting an owner when another active owner exists', async () => {
    const organization = await createOrganization(
      'shared-owner',
      'Shared Owner',
    );

    const secondUser = expectUserResponse(
      (
        await request(httpServer)
          .post('/api/users')
          .set('x-organization-id', organization.id)
          .send({ email: 'second-owner@example.com' })
          .expect(HttpStatus.CREATED)
      ).body,
    );

    await prisma.organizationUser.update({
      where: {
        userId_organizationId: {
          userId: BigInt(secondUser.id),
          organizationId: BigInt(organization.id),
        },
      },
      data: {
        governanceRole: 'owner',
      },
    });

    await request(httpServer)
      .delete(`/api/users/${organization.owner.id}`)
      .set('x-organization-id', organization.id)
      .expect(HttpStatus.NO_CONTENT);

    await request(httpServer)
      .get(`/api/users/${organization.owner.id}`)
      .set('x-organization-id', organization.id)
      .expect(HttpStatus.NOT_FOUND);

    const deletedUser = await prisma.user.findUniqueOrThrow({
      where: { id: BigInt(organization.owner.id) },
    });
    expect(deletedUser.deletedAt).toBeInstanceOf(Date);
  });

  it('grants ownership to another active member and can transfer sole ownership', async () => {
    const organization = await createOrganization('owner-flows', 'Owner Flows');

    const targetMember = expectUserResponse(
      (
        await request(httpServer)
          .post('/api/users')
          .set('x-organization-id', organization.id)
          .send({ email: 'target-member@example.com' })
          .expect(HttpStatus.CREATED)
      ).body,
    );
    const ownerToken = organization.ownerToken;

    await request(httpServer)
      .post(`/api/organization-memberships/${targetMember.id}/owners`)
      .set('x-organization-id', organization.id)
      .set('authorization', `Bearer ${ownerToken}`)
      .expect(HttpStatus.NO_CONTENT);

    let targetMembership = await prisma.organizationUser.findUniqueOrThrow({
      where: {
        userId_organizationId: {
          userId: BigInt(targetMember.id),
          organizationId: BigInt(organization.id),
        },
      },
    });
    expect(targetMembership.governanceRole).toBe('owner');

    await prisma.organizationUser.update({
      where: {
        userId_organizationId: {
          userId: BigInt(targetMember.id),
          organizationId: BigInt(organization.id),
        },
      },
      data: {
        governanceRole: 'member',
      },
    });

    await request(httpServer)
      .post(
        `/api/organization-memberships/${targetMember.id}/ownership-transfers`,
      )
      .set('x-organization-id', organization.id)
      .set('authorization', `Bearer ${ownerToken}`)
      .send({ fromUserId: organization.owner.id })
      .expect(HttpStatus.NO_CONTENT);

    const memberships = await prisma.organizationUser.findMany({
      where: {
        organizationId: BigInt(organization.id),
      },
      orderBy: { userId: 'asc' },
    });
    expect(
      memberships.filter((membership) => membership.governanceRole === 'owner'),
    ).toHaveLength(1);
    targetMembership = await prisma.organizationUser.findUniqueOrThrow({
      where: {
        userId_organizationId: {
          userId: BigInt(targetMember.id),
          organizationId: BigInt(organization.id),
        },
      },
    });
    expect(targetMembership.governanceRole).toBe('owner');
  });

  it('supports invitation acceptance for an authenticated user with matching email', async () => {
    const organization = await createOrganization(
      'invitation-org',
      'Invitation Org',
    );
    const ownerToken = organization.ownerToken;

    const invitation = (
      await request(httpServer)
        .post('/api/organization-invitations')
        .set('x-organization-id', organization.id)
        .set('authorization', `Bearer ${ownerToken}`)
        .send({
          email: 'invited-member@example.com',
          governanceRole: 'member',
        })
        .expect(HttpStatus.CREATED)
    ).body as {
      id: string;
      email: string;
      status: string;
    };
    expect(invitation.status).toBe('pending');

    const listedUsersBeforeActivation = (
      await request(httpServer)
        .get('/api/users')
        .set('x-organization-id', organization.id)
        .expect(HttpStatus.OK)
    ).body as UserResponse[];
    expect(listedUsersBeforeActivation).toHaveLength(1);
    expect(
      listedUsersBeforeActivation.some(
        (user) => user.email === invitation.email,
      ),
    ).toBe(false);

    const invitedUser = (
      await request(httpServer)
        .post('/api/auth/register')
        .send({
          email: 'invited-member@example.com',
          password: testPassword,
        })
        .expect(HttpStatus.CREATED)
    ).body as {
      access_token: string;
      user: { id: string };
    };

    await request(httpServer)
      .post(`/api/organization-invitations/${invitation.id}/accept`)
      .set('authorization', `Bearer ${invitedUser.access_token}`)
      .expect(HttpStatus.NO_CONTENT);

    const listedUsersAfterActivation = (
      await request(httpServer)
        .get('/api/users')
        .set('x-organization-id', organization.id)
        .expect(HttpStatus.OK)
    ).body as UserResponse[];
    expect(listedUsersAfterActivation).toHaveLength(2);
    expect(
      listedUsersAfterActivation.some(
        (user) => user.id === invitedUser.user.id,
      ),
    ).toBe(true);
  });

  it('lists pending invitations for the authenticated user', async () => {
    const organization = await createOrganization('invite-feed', 'Invite Feed');

    const invitation = (
      await request(httpServer)
        .post('/api/organization-invitations')
        .set('x-organization-id', organization.id)
        .set('authorization', `Bearer ${organization.ownerToken}`)
        .send({
          email: 'pending-invitee@example.com',
          governanceRole: 'member',
        })
        .expect(HttpStatus.CREATED)
    ).body as {
      id: string;
      email: string;
      governanceRole: 'owner' | 'member';
      status: string;
    };

    const invitee = (
      await request(httpServer)
        .post('/api/auth/register')
        .send({
          email: 'pending-invitee@example.com',
          password: testPassword,
        })
        .expect(HttpStatus.CREATED)
    ).body as {
      access_token: string;
    };

    const invitations = (
      await request(httpServer)
        .get('/api/organization-invitations/mine')
        .set('authorization', `Bearer ${invitee.access_token}`)
        .expect(HttpStatus.OK)
    ).body as Array<{
      id: string;
      email: string;
      governanceRole: 'owner' | 'member';
      status: string;
      organization: {
        id: string;
        name: string;
        slug: string;
      };
    }>;

    expect(invitations).toHaveLength(1);
    expect(invitations[0]).toMatchObject({
      id: invitation.id,
      email: 'pending-invitee@example.com',
      governanceRole: 'member',
      status: 'pending',
      organization: {
        id: organization.id,
        name: 'Invite Feed',
        slug: 'invite-feed',
      },
    });
  });

  it('rejects a pending invitation for the authenticated user', async () => {
    const organization = await createOrganization(
      'reject-invite',
      'Reject Invite',
    );

    const invitation = (
      await request(httpServer)
        .post('/api/organization-invitations')
        .set('x-organization-id', organization.id)
        .set('authorization', `Bearer ${organization.ownerToken}`)
        .send({
          email: 'reject-invitee@example.com',
          governanceRole: 'member',
        })
        .expect(HttpStatus.CREATED)
    ).body as {
      id: string;
      email: string;
      status: string;
    };

    const invitee = (
      await request(httpServer)
        .post('/api/auth/register')
        .send({
          email: 'reject-invitee@example.com',
          password: testPassword,
        })
        .expect(HttpStatus.CREATED)
    ).body as {
      access_token: string;
    };

    await request(httpServer)
      .post(`/api/organization-invitations/${invitation.id}/reject`)
      .set('authorization', `Bearer ${invitee.access_token}`)
      .expect(HttpStatus.NO_CONTENT);

    const invitations = (
      await request(httpServer)
        .get('/api/organization-invitations/mine')
        .set('authorization', `Bearer ${invitee.access_token}`)
        .expect(HttpStatus.OK)
    ).body as Array<{ id: string }>;

    const rejectedInvitation =
      await prisma.organizationInvitation.findUniqueOrThrow({
        where: { id: BigInt(invitation.id) },
      });

    expect(rejectedInvitation.status).toBe('rejected');
    expect(rejectedInvitation.rejectedAt).toBeInstanceOf(Date);
    expect(invitations).toHaveLength(0);
  });

  it('keeps roles isolated per organization and rejects cross-org assignment', async () => {
    const organizationA = await createOrganization('assign-a', 'Assign A');
    const organizationB = await createOrganization('assign-b', 'Assign B');
    const user = expectUserResponse(
      (
        await request(httpServer)
          .post('/api/users')
          .set('x-organization-id', organizationA.id)
          .send({ email: 'assign@example.com' })
          .expect(HttpStatus.CREATED)
      ).body,
    );
    await request(httpServer)
      .post('/api/users')
      .set('x-organization-id', organizationB.id)
      .send({ email: 'assign@example.com' })
      .expect(HttpStatus.CREATED);

    const roleA = expectRoleResponse(
      (
        await request(httpServer)
          .post('/api/roles')
          .set('x-organization-id', organizationA.id)
          .send({ name: 'Admin' })
          .expect(HttpStatus.CREATED)
      ).body,
    );

    await request(httpServer)
      .post(`/api/users/${user.id}/roles`)
      .set('x-organization-id', organizationB.id)
      .send({ roleId: roleA.id })
      .expect(HttpStatus.NOT_FOUND);
  });

  it('supports permission CRUD and org-scoped role-permission assignment', async () => {
    const organizationA = await createOrganization('perm-a', 'Perm A');
    const organizationB = await createOrganization('perm-b', 'Perm B');

    const permission = expectPermissionResponse(
      (
        await request(httpServer)
          .post('/api/permissions')
          .set('x-organization-id', organizationA.id)
          .send({
            key: 'catalog.manage',
            description: 'Manage catalog',
          })
          .expect(HttpStatus.CREATED)
      ).body,
    );

    await request(httpServer)
      .post('/api/permissions')
      .set('x-organization-id', organizationB.id)
      .send({ key: 'catalog.manage' })
      .expect(HttpStatus.BAD_REQUEST);

    const roleA = expectRoleResponse(
      (
        await request(httpServer)
          .post('/api/roles')
          .set('x-organization-id', organizationA.id)
          .send({ name: 'Catalog Manager' })
          .expect(HttpStatus.CREATED)
      ).body,
    );
    const roleB = expectRoleResponse(
      (
        await request(httpServer)
          .post('/api/roles')
          .set('x-organization-id', organizationB.id)
          .send({ name: 'Viewer' })
          .expect(HttpStatus.CREATED)
      ).body,
    );

    await request(httpServer)
      .post(`/api/roles/${roleA.id}/permissions`)
      .set('x-organization-id', organizationA.id)
      .send({ permissionId: permission.id })
      .expect(HttpStatus.CREATED);

    await request(httpServer)
      .post(`/api/roles/${roleA.id}/permissions`)
      .set('x-organization-id', organizationA.id)
      .send({ permissionId: permission.id })
      .expect(HttpStatus.BAD_REQUEST);

    await request(httpServer)
      .post(`/api/roles/${roleA.id}/permissions`)
      .set('x-organization-id', organizationB.id)
      .send({ permissionId: permission.id })
      .expect(HttpStatus.NOT_FOUND);

    const scopedPermissions = (
      await request(httpServer)
        .get(`/api/roles/${roleA.id}/permissions`)
        .set('x-organization-id', organizationA.id)
        .expect(HttpStatus.OK)
    ).body as PermissionResponse[];
    expect(scopedPermissions.map((item) => item.key)).toEqual([
      'catalog.manage',
    ]);

    await request(httpServer)
      .get(`/api/roles/${roleB.id}/permissions`)
      .set('x-organization-id', organizationB.id)
      .expect(HttpStatus.OK)
      .expect([]);
  });

  it('enforces unique role names per organization', async () => {
    const organizationA = await createOrganization('dup-role-a', 'Dup Role A');
    const organizationB = await createOrganization('dup-role-b', 'Dup Role B');

    await request(httpServer)
      .post('/api/roles')
      .set('x-organization-id', organizationA.id)
      .send({ name: 'Admin' })
      .expect(HttpStatus.CREATED);

    await request(httpServer)
      .post('/api/roles')
      .set('x-organization-id', organizationA.id)
      .send({ name: 'Admin' })
      .expect(HttpStatus.BAD_REQUEST);

    await request(httpServer)
      .post('/api/roles')
      .set('x-organization-id', organizationB.id)
      .send({ name: 'Admin' })
      .expect(HttpStatus.CREATED);
  });

  it('creates, lists, searches, updates, and soft-deletes org-scoped suppliers', async () => {
    const organizationA = await createOrganization('supplier-a', 'Supplier A');
    const organizationB = await createOrganization('supplier-b', 'Supplier B');

    await request(httpServer)
      .get('/api/suppliers')
      .set('x-organization-id', organizationA.id)
      .expect(HttpStatus.UNAUTHORIZED);

    const unrelatedUser = (
      await request(httpServer)
        .post('/api/auth/register')
        .send({
          email: 'supplier-unrelated@example.com',
          password: testPassword,
        })
        .expect(HttpStatus.CREATED)
    ).body as { access_token: string };

    await request(httpServer)
      .get('/api/suppliers')
      .set('authorization', `Bearer ${unrelatedUser.access_token}`)
      .set('x-organization-id', organizationA.id)
      .expect(HttpStatus.FORBIDDEN);

    const supplierA = (
      await request(httpServer)
        .post('/api/suppliers')
        .set('authorization', `Bearer ${organizationA.ownerToken}`)
        .set('x-organization-id', organizationA.id)
        .send({
          name: ' Acme Supply ',
          phoneNumber: ' +1 415 555 2671 ',
          email: ' orders@acme.example ',
          address: {
            line1: ' 100 Main Street ',
            city: ' Austin ',
            region: ' TX ',
            postalCode: ' 78701 ',
            countryCode: ' us ',
          },
          website: ' https://acme.example ',
        })
        .expect(HttpStatus.CREATED)
    ).body as {
      id: string;
      name: string;
      phoneNumber: string | null;
      email: string | null;
      address: { fullAddress: string; city: string | null } | null;
      website: string | null;
    };
    expect(supplierA).toMatchObject({
      name: 'Acme Supply',
      phoneNumber: '+1 415 555 2671',
      email: 'orders@acme.example',
      address: {
        fullAddress: '100 Main Street, Austin, TX 78701, US',
        city: 'Austin',
      },
      website: 'https://acme.example',
    });
    expectHiddenFieldIsAbsent(supplierA, 'organizationId');
    expectHiddenFieldIsAbsent(supplierA, 'deletedAt');

    await request(httpServer)
      .post('/api/suppliers')
      .set('authorization', `Bearer ${organizationB.ownerToken}`)
      .set('x-organization-id', organizationB.id)
      .send({ name: 'Beta Supply', email: 'beta@example.com' })
      .expect(HttpStatus.CREATED);

    const listed = (
      await request(httpServer)
        .get(
          '/api/suppliers?page=1&limit=10&search=555&sort[field]=name&sort[criteria]=asc',
        )
        .set('authorization', `Bearer ${organizationA.ownerToken}`)
        .set('x-organization-id', organizationA.id)
        .expect(HttpStatus.OK)
    ).body as {
      data: Array<{ id: string; name: string; phoneNumber: string | null }>;
      meta: { pagination: { page: number; pageSize: number; total: number } };
    };

    expect(listed.data).toHaveLength(1);
    expect(listed.data[0]?.id).toBe(supplierA.id);
    expect(listed.meta.pagination).toMatchObject({
      page: 1,
      pageSize: 10,
      total: 1,
    });

    await request(httpServer)
      .get(`/api/suppliers/${supplierA.id}`)
      .set('authorization', `Bearer ${organizationB.ownerToken}`)
      .set('x-organization-id', organizationB.id)
      .expect(HttpStatus.NOT_FOUND);

    const updated = (
      await request(httpServer)
        .patch(`/api/suppliers/${supplierA.id}`)
        .set('authorization', `Bearer ${organizationA.ownerToken}`)
        .set('x-organization-id', organizationA.id)
        .send({ name: 'Acme Supply Co', phoneNumber: '' })
        .expect(HttpStatus.OK)
    ).body as { id: string; name: string; phoneNumber: string | null };
    expect(updated).toMatchObject({
      id: supplierA.id,
      name: 'Acme Supply Co',
      phoneNumber: null,
    });

    const clearedAddress = (
      await request(httpServer)
        .patch(`/api/suppliers/${supplierA.id}`)
        .set('authorization', `Bearer ${organizationA.ownerToken}`)
        .set('x-organization-id', organizationA.id)
        .send({
          address: {
            line1: '',
            line2: '',
            city: '',
            region: '',
            postalCode: '',
            countryCode: '',
          },
        })
        .expect(HttpStatus.OK)
    ).body as {
      id: string;
      address: null;
    };
    expect(clearedAddress).toMatchObject({
      id: supplierA.id,
      address: null,
    });

    await request(httpServer)
      .get('/api/suppliers?select=all')
      .set('authorization', `Bearer ${organizationA.ownerToken}`)
      .set('x-organization-id', organizationA.id)
      .expect(HttpStatus.BAD_REQUEST);

    await request(httpServer)
      .get('/api/suppliers?sort[field]=organizationId&sort[criteria]=asc')
      .set('authorization', `Bearer ${organizationA.ownerToken}`)
      .set('x-organization-id', organizationA.id)
      .expect(HttpStatus.BAD_REQUEST);

    await request(httpServer)
      .delete(`/api/suppliers/${supplierA.id}`)
      .set('authorization', `Bearer ${organizationA.ownerToken}`)
      .set('x-organization-id', organizationA.id)
      .expect(HttpStatus.NO_CONTENT);

    await request(httpServer)
      .get(`/api/suppliers/${supplierA.id}`)
      .set('authorization', `Bearer ${organizationA.ownerToken}`)
      .set('x-organization-id', organizationA.id)
      .expect(HttpStatus.NOT_FOUND);
  });

  async function createOrganization(slug: string, name: string) {
    const registration = (
      await request(httpServer)
        .post('/api/auth/register')
        .send({
          email: `${slug}-owner@example.com`,
          password: testPassword,
          name: `${name} Owner`,
        })
        .expect(HttpStatus.CREATED)
    ).body as {
      access_token: string;
      user: { id: string; email: string; name: string | null };
    };

    const organization = expectOrganizationResponse(
      (
        await request(httpServer)
          .post('/api/organizations')
          .set('authorization', `Bearer ${registration.access_token}`)
          .send({ name, slug })
          .expect(HttpStatus.CREATED)
      ).body,
    );

    return {
      ...organization,
      owner: registration.user,
      ownerToken: registration.access_token,
    };
  }
});

function expectOrganizationResponse(
  body: unknown,
): Pick<OrganizationResponse, 'id' | 'name' | 'slug'> {
  const organization = body as Pick<
    OrganizationResponse,
    'id' | 'name' | 'slug'
  >;
  expect(organization.id).toEqual(expect.any(String));
  expect(organization.name).toEqual(expect.any(String));
  expect(organization.slug).toEqual(expect.any(String));
  return organization;
}

function expectUserResponse(
  body: unknown,
): Pick<
  UserResponse,
  'id' | 'email' | 'name' | 'avatarUrl' | 'organization' | 'roles'
> {
  const user = body as Pick<
    UserResponse,
    'id' | 'email' | 'name' | 'avatarUrl' | 'organization' | 'roles'
  >;

  expect(user.id).toEqual(expect.any(String));
  expect(user.email).toEqual(expect.any(String));
  expectHiddenFieldIsAbsent(body, 'organizationUsers');
  expectHiddenFieldIsAbsent(body, 'deletedAt');
  return user;
}

function expectRoleResponse(body: unknown): Pick<RoleResponse, 'id' | 'name'> {
  const role = body as Pick<RoleResponse, 'id' | 'name'>;
  expect(role.id).toEqual(expect.any(String));
  expect(role.name).toEqual(expect.any(String));
  return role;
}

function expectPermissionResponse(
  body: unknown,
): Pick<PermissionResponse, 'id' | 'key'> {
  const permission = body as Pick<PermissionResponse, 'id' | 'key'>;
  expect(permission.id).toEqual(expect.any(String));
  expect(permission.key).toEqual(expect.any(String));
  return permission;
}

function expectHiddenFieldIsAbsent(body: unknown, key: string) {
  expect(body).not.toHaveProperty(key);
}
