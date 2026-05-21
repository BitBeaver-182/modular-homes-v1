import { INestApplication } from '@nestjs/common';
import { Server } from 'node:http';
import request from 'supertest';
import { PrismaService } from '../../src/database/prisma.service';
import {
  createRealDbTestApp,
  truncateTestDatabase,
} from '../helpers/db-test-harness';

type EntityReference = {
  id: string;
};

type HealthResponse = {
  status: 'ok';
  service: 'api';
  timestamp: string;
};

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

  it('serves the root and health endpoints through the production-style bootstrap', async () => {
    await request(httpServer).get('/api').expect(200).expect('Hello World!');

    const healthResponse = await request(httpServer)
      .get('/api/health')
      .expect(200);

    expect(healthResponse.body).toEqual({
      status: 'ok',
      service: 'api',
      timestamp: expect.any(String),
    } satisfies HealthResponse);
  });

  it('creates, reads, updates, and soft deletes organizations through HTTP', async () => {
    const createResponse = await request(httpServer)
      .post('/api/organizations')
      .send({ name: 'Acme Homes', slug: 'acme-homes' })
      .expect(201);
    const organization = createResponse.body as EntityReference;

    expect(organization.id).toEqual(expect.any(String));

    const persistedOrganization = await prisma.organization.findUniqueOrThrow({
      where: { id: BigInt(organization.id) },
    });

    expect(persistedOrganization.name).toBe('Acme Homes');
    expect(persistedOrganization.slug).toBe('acme-homes');

    await request(httpServer)
      .get(`/api/organizations/${organization.id}`)
      .expect(200)
      .expect({
        id: organization.id,
        name: 'Acme Homes',
        slug: 'acme-homes',
        createdAt: persistedOrganization.createdAt.toISOString(),
        updatedAt: persistedOrganization.updatedAt.toISOString(),
        deletedAt: null,
      });

    const updateResponse = await request(httpServer)
      .patch(`/api/organizations/${organization.id}`)
      .send({ name: 'Acme Homes Europe' })
      .expect(200);

    expect(updateResponse.body.name).toBe('Acme Homes Europe');

    const updatedOrganization = await prisma.organization.findUniqueOrThrow({
      where: { id: BigInt(organization.id) },
    });

    expect(updatedOrganization.name).toBe('Acme Homes Europe');

    await request(httpServer)
      .delete(`/api/organizations/${organization.id}`)
      .expect(200);

    const deletedOrganization = await prisma.organization.findUniqueOrThrow({
      where: { id: BigInt(organization.id) },
    });

    expect(deletedOrganization.deletedAt).toEqual(expect.any(Date));

    await request(httpServer).get('/api/organizations').expect(200).expect([]);
    await request(httpServer)
      .get(`/api/organizations/${organization.id}`)
      .expect(404);
  });

  it('creates, reads, updates, and soft deletes users through HTTP', async () => {
    const firstOrganizationResponse = await request(httpServer)
      .post('/api/organizations')
      .send({ name: 'Atlas', slug: 'atlas' })
      .expect(201);
    const firstOrganization = firstOrganizationResponse.body as EntityReference;

    const userResponse = await request(httpServer)
      .post('/api/users')
      .send({
        email: 'user@example.com',
        name: 'Initial User',
        organizationId: firstOrganization.id,
      })
      .expect(201);

    expect(userResponse.body.id).toEqual(expect.any(String));
    expect(userResponse.body.memberships).toHaveLength(1);
    expect(userResponse.body.memberships[0]).toMatchObject({
      organizationId: firstOrganization.id,
      deletedAt: null,
    });

    const user = userResponse.body as EntityReference;

    const persistedUser = await prisma.user.findUniqueOrThrow({
      where: { id: BigInt(user.id) },
    });

    expect(persistedUser.email).toBe('user@example.com');
    expect(persistedUser.name).toBe('Initial User');

    await request(httpServer)
      .get(`/api/users/${user.id}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          id: user.id,
          email: 'user@example.com',
          name: 'Initial User',
          deletedAt: null,
        });
        expect(response.body.memberships).toHaveLength(1);
      });

    const updateResponse = await request(httpServer)
      .patch(`/api/users/${user.id}`)
      .send({
        name: 'Updated User',
        avatarUrl: 'https://example.com/avatar.png',
      })
      .expect(200);

    expect(updateResponse.body.name).toBe('Updated User');
    expect(updateResponse.body.avatarUrl).toBe(
      'https://example.com/avatar.png',
    );

    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: BigInt(user.id) },
    });

    expect(updatedUser.name).toBe('Updated User');
    expect(updatedUser.avatarUrl).toBe('https://example.com/avatar.png');

    await request(httpServer).delete(`/api/users/${user.id}`).expect(200);

    const deletedUser = await prisma.user.findUniqueOrThrow({
      where: { id: BigInt(user.id) },
    });

    expect(deletedUser.deletedAt).toEqual(expect.any(Date));

    await request(httpServer).get('/api/users').expect(200).expect([]);
    await request(httpServer).get(`/api/users/${user.id}`).expect(404);
  });

  it('supports membership lifecycle with persisted attach and detach behavior', async () => {
    const firstOrganizationResponse = await request(httpServer)
      .post('/api/organizations')
      .send({ name: 'Acme', slug: 'acme' })
      .expect(201);
    const firstOrganization = firstOrganizationResponse.body as EntityReference;

    const userResponse = await request(httpServer)
      .post('/api/users')
      .send({
        email: 'member@example.com',
        organizationId: firstOrganization.id,
      })
      .expect(201);
    const user = userResponse.body as EntityReference;

    const secondOrganizationResponse = await request(httpServer)
      .post('/api/organizations')
      .send({ name: 'Beta', slug: 'beta' })
      .expect(201);
    const secondOrganization =
      secondOrganizationResponse.body as EntityReference;

    const attachResponse = await request(httpServer)
      .post(`/api/organizations/${secondOrganization.id}/users`)
      .send({ userId: user.id })
      .expect(201);

    expect(attachResponse.body).toMatchObject({
      organizationId: secondOrganization.id,
      userId: user.id,
      deletedAt: null,
    });

    const attachedMembership = await prisma.membership.findFirstOrThrow({
      where: {
        organizationId: BigInt(secondOrganization.id),
        userId: BigInt(user.id),
      },
    });

    expect(attachedMembership.deletedAt).toBeNull();

    await request(httpServer)
      .delete(`/api/organizations/${secondOrganization.id}/users/${user.id}`)
      .expect(200);

    const softDeletedMembership = await prisma.membership.findFirstOrThrow({
      where: {
        organizationId: BigInt(secondOrganization.id),
        userId: BigInt(user.id),
      },
    });

    expect(softDeletedMembership.deletedAt).toEqual(expect.any(Date));

    await request(httpServer)
      .delete(`/api/organizations/${firstOrganization.id}/users/${user.id}`)
      .expect(400);
  });

  it('reactivates a soft deleted membership instead of creating a second row', async () => {
    const primaryOrganizationResponse = await request(httpServer)
      .post('/api/organizations')
      .send({ name: 'Gamma', slug: 'gamma' })
      .expect(201);
    const primaryOrganization =
      primaryOrganizationResponse.body as EntityReference;

    const userResponse = await request(httpServer)
      .post('/api/users')
      .send({
        email: 'reactivate@example.com',
        organizationId: primaryOrganization.id,
      })
      .expect(201);
    const user = userResponse.body as EntityReference;

    const secondaryOrganizationResponse = await request(httpServer)
      .post('/api/organizations')
      .send({ name: 'Delta', slug: 'delta' })
      .expect(201);
    const secondaryOrganization =
      secondaryOrganizationResponse.body as EntityReference;

    const initialAttachResponse = await request(httpServer)
      .post(`/api/organizations/${secondaryOrganization.id}/users`)
      .send({ userId: user.id })
      .expect(201);

    await request(httpServer)
      .delete(`/api/organizations/${secondaryOrganization.id}/users/${user.id}`)
      .expect(200);

    const reattachResponse = await request(httpServer)
      .post(`/api/organizations/${secondaryOrganization.id}/users`)
      .send({ userId: user.id })
      .expect(201);

    expect(reattachResponse.body.id).toBe(initialAttachResponse.body.id);

    const memberships = await prisma.membership.findMany({
      where: {
        organizationId: BigInt(secondaryOrganization.id),
        userId: BigInt(user.id),
      },
    });

    expect(memberships).toHaveLength(1);
    expect(memberships[0]?.deletedAt).toBeNull();
  });

  it('rejects malformed organization membership payloads before persistence', async () => {
    const organizationResponse = await request(httpServer)
      .post('/api/organizations')
      .send({ name: 'Echo', slug: 'echo' })
      .expect(201);
    const organization = organizationResponse.body as EntityReference;

    await request(httpServer)
      .post(`/api/organizations/${organization.id}/users`)
      .send({})
      .expect(400);

    const membershipCount = await prisma.membership.count({
      where: { organizationId: BigInt(organization.id) },
    });

    expect(membershipCount).toBe(0);
  });

  it('rejects invalid user payloads at the validation layer', async () => {
    const organizationResponse = await request(httpServer)
      .post('/api/organizations')
      .send({ name: 'Foxtrot', slug: 'foxtrot' })
      .expect(201);
    const organization = organizationResponse.body as EntityReference;

    await request(httpServer)
      .post('/api/users')
      .send({
        email: 'not-an-email',
        organizationId: organization.id,
      })
      .expect(400);

    const userCount = await prisma.user.count();

    expect(userCount).toBe(0);
  });

  it('rejects malformed path identifiers before hitting the database', async () => {
    await request(httpServer).get('/api/users/not-a-number').expect(400);
    await request(httpServer)
      .get('/api/organizations/not-a-number')
      .expect(400);
  });
});
