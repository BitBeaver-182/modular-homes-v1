import { HttpStatus, INestApplication } from '@nestjs/common';
import { Server } from 'node:http';
import request, { Response } from 'supertest';
import type { MembershipDto } from '../../src/memberships/dto/membership.dto';
import type { OrganizationDto } from '../../src/organizations/dto/organization-response.dto';
import type { UserDto } from '../../src/users/dto/user-response.dto';
import { PrismaService } from '../../src/database/prisma.service';
import {
  createRealDbTestApp,
  truncateTestDatabase,
} from '../helpers/db-test-harness';

describe('API (e2e)', () => {
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

  it('serializes organization responses without internal fields', async () => {
    const organization = expectOrganizationResponse(
      (
        await request(httpServer)
          .post('/api/organizations')
          .send({ name: 'Acme Corp', slug: 'acme' })
          .expect(HttpStatus.CREATED)
      ).body,
    );

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
      Pick<OrganizationDto, 'id' | 'name' | 'slug'>
    >;
    expect(organizations).toHaveLength(1);
    expect(organizations[0]?.id).toBe(organization.id);
    expectHiddenFieldIsAbsent(organizations[0], 'deletedAt');
  });

  it('serializes user responses with organizations instead of memberships', async () => {
    const organization = expectOrganizationResponse(
      (
        await request(httpServer)
          .post('/api/organizations')
          .send({ name: 'Acme Corp', slug: 'acme' })
          .expect(HttpStatus.CREATED)
      ).body,
    );

    const user = expectUserResponse(
      (
        await request(httpServer)
          .post('/api/users')
          .send({
            email: 'founder@acme.com',
            name: 'Alice Founder',
            organizationId: organization.id,
          })
          .expect(HttpStatus.CREATED)
      ).body,
    );

    expect(user.organizations).toHaveLength(1);
    expect(user.organizations[0]?.id).toBe(organization.id);

    const fetchedUser = expectUserResponse(
      (
        await request(httpServer)
          .get(`/api/users/${user.id}`)
          .expect(HttpStatus.OK)
      ).body,
    );
    expect(fetchedUser.organizations[0]?.slug).toBe(organization.slug);

    const usersRes = await request(httpServer)
      .get('/api/users')
      .expect(HttpStatus.OK);
    const users = usersRes.body as Array<
      Pick<UserDto, 'id' | 'email' | 'name' | 'avatarUrl' | 'organizations'>
    >;
    expect(users).toHaveLength(1);
    expect(users[0]?.organizations[0]?.id).toBe(organization.id);
    expectHiddenFieldIsAbsent(users[0], 'memberships');
    expectHiddenFieldIsAbsent(users[0], 'deletedAt');
  });

  it('does not return deleted organizations and removes them from user responses', async () => {
    const organization = expectOrganizationResponse(
      (
        await request(httpServer)
          .post('/api/organizations')
          .send({ name: 'Old Guard', slug: 'old-guard' })
          .expect(HttpStatus.CREATED)
      ).body,
    );

    const user = expectUserResponse(
      (
        await request(httpServer)
          .post('/api/users')
          .send({
            email: 'member@old-guard.com',
            name: 'Member',
            organizationId: organization.id,
          })
          .expect(HttpStatus.CREATED)
      ).body,
    );
    expect(user.organizations[0]?.id).toBe(organization.id);

    await request(httpServer)
      .delete(`/api/organizations/${organization.id}`)
      .expect(HttpStatus.OK);

    const organizationsRes = await request(httpServer)
      .get('/api/organizations')
      .expect(HttpStatus.OK);
    expect(organizationsRes.body).toEqual([]);

    const fetchedUser = expectUserResponse(
      (
        await request(httpServer)
          .get(`/api/users/${user.id}`)
          .expect(HttpStatus.OK)
      ).body,
    );
    expect(fetchedUser.organizations).toEqual([]);

    const usersRes = await request(httpServer)
      .get('/api/users')
      .expect(HttpStatus.OK);
    const users = usersRes.body as Array<
      Pick<UserDto, 'id' | 'email' | 'name' | 'avatarUrl' | 'organizations'>
    >;
    expect(users).toHaveLength(1);
    expect(users[0]?.organizations).toEqual([]);
  });

  it('reactivates a soft-deleted user and their membership', async () => {
    const organization = expectOrganizationResponse(
      (
        await request(httpServer)
          .post('/api/organizations')
          .send({ name: 'Rejoin Inc', slug: 'rejoin-inc' })
          .expect(HttpStatus.CREATED)
      ).body,
    );

    const user = expectUserResponse(
      (
        await request(httpServer)
          .post('/api/users')
          .send({
            email: 'leaver@example.com',
            name: 'Leaver',
            organizationId: organization.id,
          })
          .expect(HttpStatus.CREATED)
      ).body,
    );

    await request(httpServer)
      .delete(`/api/users/${user.id}`)
      .expect(HttpStatus.OK);

    await request(httpServer)
      .post('/api/users')
      .send({
        email: 'leaver@example.com',
        name: 'Returned User',
        organizationId: organization.id,
      })
      .expect(HttpStatus.CREATED)
      .expect((res: Response) => {
        const reactivatedUser = expectUserResponse(res.body);
        expect(reactivatedUser.id).toBe(user.id);
        expect(reactivatedUser.name).toBe('Returned User');
        expect(reactivatedUser.organizations[0]?.id).toBe(organization.id);
      });

    const usersRes = await request(httpServer)
      .get('/api/users')
      .expect(HttpStatus.OK);
    const users = usersRes.body as Array<
      Pick<UserDto, 'id' | 'email' | 'name' | 'avatarUrl' | 'organizations'>
    >;
    expect(users).toHaveLength(1);
    expect(users[0]?.email).toBe('leaver@example.com');
    expect(users[0]?.organizations[0]?.id).toBe(organization.id);
  });

  it('fails to create a user without organizationId', async () => {
    await request(httpServer)
      .post('/api/users')
      .send({
        email: 'no-org@example.com',
        name: 'No Org',
      })
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('does not allow duplicate organization slug', async () => {
    await request(httpServer)
      .post('/api/organizations')
      .send({ name: 'Acme Corp', slug: 'acme' })
      .expect(HttpStatus.CREATED);

    await request(httpServer)
      .post('/api/organizations')
      .send({ name: 'Another Acme', slug: 'acme' })
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('does not allow duplicate active membership', async () => {
    const organizationA = expectOrganizationResponse(
      (
        await request(httpServer)
          .post('/api/organizations')
          .send({ name: 'Client A', slug: 'client-a' })
          .expect(HttpStatus.CREATED)
      ).body,
    );
    const organizationB = expectOrganizationResponse(
      (
        await request(httpServer)
          .post('/api/organizations')
          .send({ name: 'Client B', slug: 'client-b' })
          .expect(HttpStatus.CREATED)
      ).body,
    );
    const user = expectUserResponse(
      (
        await request(httpServer)
          .post('/api/users')
          .send({
            email: 'user@example.com',
            name: 'User',
            organizationId: organizationA.id,
          })
          .expect(HttpStatus.CREATED)
      ).body,
    );

    expectMembershipResponse(
      (
        await request(httpServer)
          .post(`/api/organizations/${organizationB.id}/users`)
          .send({ userId: user.id })
          .expect(HttpStatus.CREATED)
      ).body,
    );

    await request(httpServer)
      .post(`/api/organizations/${organizationB.id}/users`)
      .send({ userId: user.id })
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('blocks detaching the last membership', async () => {
    const organization = expectOrganizationResponse(
      (
        await request(httpServer)
          .post('/api/organizations')
          .send({ name: 'Solo Org', slug: 'solo-org' })
          .expect(HttpStatus.CREATED)
      ).body,
    );
    const user = expectUserResponse(
      (
        await request(httpServer)
          .post('/api/users')
          .send({
            email: 'solo@example.com',
            name: 'Solo User',
            organizationId: organization.id,
          })
          .expect(HttpStatus.CREATED)
      ).body,
    );

    await request(httpServer)
      .delete(`/api/organizations/${organization.id}/users/${user.id}`)
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('returns not found when membership does not exist or has been soft deleted', async () => {
    const organizationA = expectOrganizationResponse(
      (
        await request(httpServer)
          .post('/api/organizations')
          .send({ name: 'Primary Org', slug: 'primary-org' })
          .expect(HttpStatus.CREATED)
      ).body,
    );
    const organizationB = expectOrganizationResponse(
      (
        await request(httpServer)
          .post('/api/organizations')
          .send({ name: 'Secondary Org', slug: 'secondary-org' })
          .expect(HttpStatus.CREATED)
      ).body,
    );
    const user = expectUserResponse(
      (
        await request(httpServer)
          .post('/api/users')
          .send({
            email: 'member@example.com',
            name: 'Member',
            organizationId: organizationA.id,
          })
          .expect(HttpStatus.CREATED)
      ).body,
    );

    await request(httpServer)
      .delete(`/api/organizations/${organizationB.id}/users/${user.id}`)
      .expect(HttpStatus.NOT_FOUND);

    expectMembershipResponse(
      (
        await request(httpServer)
          .post(`/api/organizations/${organizationB.id}/users`)
          .send({ userId: user.id })
          .expect(HttpStatus.CREATED)
      ).body,
    );

    expectMembershipResponse(
      (
        await request(httpServer)
          .delete(`/api/organizations/${organizationB.id}/users/${user.id}`)
          .expect(HttpStatus.OK)
      ).body,
    );

    await request(httpServer)
      .delete(`/api/organizations/${organizationB.id}/users/${user.id}`)
      .expect(HttpStatus.NOT_FOUND);
  });

  it('does not create membership for a deleted organization', async () => {
    const activeOrganization = expectOrganizationResponse(
      (
        await request(httpServer)
          .post('/api/organizations')
          .send({ name: 'Active Org', slug: 'active-org' })
          .expect(HttpStatus.CREATED)
      ).body,
    );
    const deletedOrganization = expectOrganizationResponse(
      (
        await request(httpServer)
          .post('/api/organizations')
          .send({ name: 'Archived Org', slug: 'archived-org' })
          .expect(HttpStatus.CREATED)
      ).body,
    );
    const user = expectUserResponse(
      (
        await request(httpServer)
          .post('/api/users')
          .send({
            email: 'attached@example.com',
            name: 'Attached User',
            organizationId: activeOrganization.id,
          })
          .expect(HttpStatus.CREATED)
      ).body,
    );

    await request(httpServer)
      .delete(`/api/organizations/${deletedOrganization.id}`)
      .expect(HttpStatus.OK);

    await request(httpServer)
      .post(`/api/organizations/${deletedOrganization.id}/users`)
      .send({ userId: user.id })
      .expect(HttpStatus.NOT_FOUND);
  });

  it('does not create membership for a deleted user and does not list that user', async () => {
    const organizationA = expectOrganizationResponse(
      (
        await request(httpServer)
          .post('/api/organizations')
          .send({ name: 'Origin Org', slug: 'origin-org' })
          .expect(HttpStatus.CREATED)
      ).body,
    );
    const organizationB = expectOrganizationResponse(
      (
        await request(httpServer)
          .post('/api/organizations')
          .send({ name: 'Target Org', slug: 'target-org' })
          .expect(HttpStatus.CREATED)
      ).body,
    );
    const user = expectUserResponse(
      (
        await request(httpServer)
          .post('/api/users')
          .send({
            email: 'departed@example.com',
            name: 'Departed User',
            organizationId: organizationA.id,
          })
          .expect(HttpStatus.CREATED)
      ).body,
    );

    await request(httpServer)
      .delete(`/api/users/${user.id}`)
      .expect(HttpStatus.OK);

    await request(httpServer)
      .get(`/api/users/${user.id}`)
      .expect(HttpStatus.NOT_FOUND);

    const usersRes = await request(httpServer)
      .get('/api/users')
      .expect(HttpStatus.OK);
    expect(usersRes.body).toEqual([]);

    await request(httpServer)
      .post(`/api/organizations/${organizationB.id}/users`)
      .send({ userId: user.id })
      .expect(HttpStatus.NOT_FOUND);
  });
});

function expectOrganizationResponse(
  body: unknown,
): Pick<OrganizationDto, 'id' | 'name' | 'slug'> {
  const organization = body as Pick<OrganizationDto, 'id' | 'name' | 'slug'>;

  expect(organization.id).toEqual(expect.any(String));
  expect(organization.name).toEqual(expect.any(String));
  expect(organization.slug).toEqual(expect.any(String));
  expectHiddenFieldIsAbsent(body, 'createdAt');
  expectHiddenFieldIsAbsent(body, 'updatedAt');
  expectHiddenFieldIsAbsent(body, 'deletedAt');

  return organization;
}

function expectUserResponse(
  body: unknown,
): Pick<UserDto, 'id' | 'email' | 'name' | 'avatarUrl' | 'organizations'> {
  const user = body as Pick<
    UserDto,
    'id' | 'email' | 'name' | 'avatarUrl' | 'organizations'
  >;

  expect(user.id).toEqual(expect.any(String));
  expect(user.email).toEqual(expect.any(String));
  expect(Array.isArray(user.organizations)).toBe(true);
  expectHiddenFieldIsAbsent(body, 'memberships');
  expectHiddenFieldIsAbsent(body, 'createdAt');
  expectHiddenFieldIsAbsent(body, 'updatedAt');
  expectHiddenFieldIsAbsent(body, 'deletedAt');

  return user;
}

function expectMembershipResponse(
  body: unknown,
): Pick<MembershipDto, 'id' | 'organizationId' | 'role'> {
  const membership = body as Pick<
    MembershipDto,
    'id' | 'organizationId' | 'role'
  >;

  expect(membership.id).toEqual(expect.any(String));
  expect(membership.organizationId).toEqual(expect.any(String));
  expect(membership.role).toEqual(expect.any(String));
  expectHiddenFieldIsAbsent(body, 'userId');
  expectHiddenFieldIsAbsent(body, 'createdAt');
  expectHiddenFieldIsAbsent(body, 'updatedAt');
  expectHiddenFieldIsAbsent(body, 'deletedAt');

  return membership;
}

function expectHiddenFieldIsAbsent(body: unknown, fieldName: string): void {
  expect(body).not.toHaveProperty(fieldName);
}
