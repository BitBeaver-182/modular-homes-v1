import { HttpStatus, INestApplication } from '@nestjs/common';
import { Server } from 'node:http';
import request, { Response } from 'supertest';
import type { OrganizationDto } from '../../src/organizations/dto/organization-response.dto';
import type { PermissionDto } from '../../src/permissions/dto/permission-response.dto';
import type { RoleDto } from '../../src/roles/dto/role-response.dto';
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
    ).body as UserDto[];
    expect(listedUsers).toHaveLength(1);
    expect(listedUsers[0]?.organization?.id).toBe(organizationA.id);

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
      .expect(HttpStatus.BAD_REQUEST);
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
    ).body as PermissionDto[];
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

  async function createOrganization(slug: string, name: string) {
    return expectOrganizationResponse(
      (
        await request(httpServer)
          .post('/api/organizations')
          .send({ name, slug })
          .expect(HttpStatus.CREATED)
      ).body,
    );
  }
});

function expectOrganizationResponse(
  body: unknown,
): Pick<OrganizationDto, 'id' | 'name' | 'slug'> {
  const organization = body as Pick<OrganizationDto, 'id' | 'name' | 'slug'>;
  expect(organization.id).toEqual(expect.any(String));
  expect(organization.name).toEqual(expect.any(String));
  expect(organization.slug).toEqual(expect.any(String));
  return organization;
}

function expectUserResponse(
  body: unknown,
): Pick<
  UserDto,
  'id' | 'email' | 'name' | 'avatarUrl' | 'organization' | 'roles'
> {
  const user = body as Pick<
    UserDto,
    'id' | 'email' | 'name' | 'avatarUrl' | 'organization' | 'roles'
  >;

  expect(user.id).toEqual(expect.any(String));
  expect(user.email).toEqual(expect.any(String));
  expectHiddenFieldIsAbsent(body, 'organizationUsers');
  expectHiddenFieldIsAbsent(body, 'deletedAt');
  return user;
}

function expectRoleResponse(body: unknown): Pick<RoleDto, 'id' | 'name'> {
  const role = body as Pick<RoleDto, 'id' | 'name'>;
  expect(role.id).toEqual(expect.any(String));
  expect(role.name).toEqual(expect.any(String));
  return role;
}

function expectPermissionResponse(
  body: unknown,
): Pick<PermissionDto, 'id' | 'key'> {
  const permission = body as Pick<PermissionDto, 'id' | 'key'>;
  expect(permission.id).toEqual(expect.any(String));
  expect(permission.key).toEqual(expect.any(String));
  return permission;
}

function expectHiddenFieldIsAbsent(body: unknown, key: string) {
  expect(body).not.toHaveProperty(key);
}
