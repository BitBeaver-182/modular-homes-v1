import { INestApplication } from '@nestjs/common';
import { Server } from 'node:http';
import request from 'supertest';
import { PrismaService } from '../../src/database/prisma.service';
import {
  applyTestMigrations,
  createRealDbTestApp,
  truncateTestDatabase,
} from '../helpers/db-test-harness';

type EntityResponse = {
  id: string;
};

describe('Membership lifecycle (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let prisma: PrismaService;

  beforeAll(async () => {
    applyTestMigrations();

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

  it('supports membership lifecycle with a last-membership guard', async () => {
    const firstOrganizationResponse = await request(httpServer)
      .post('/organizations')
      .send({ name: 'Acme', slug: 'acme' })
      .expect(201);
    const firstOrganization = firstOrganizationResponse.body as EntityResponse;

    const userResponse = await request(httpServer)
      .post('/users')
      .send({
        email: 'user@example.com',
        organizationId: firstOrganization.id,
      })
      .expect(201);
    const user = userResponse.body as EntityResponse;

    const secondOrganizationResponse = await request(httpServer)
      .post('/organizations')
      .send({ name: 'Beta', slug: 'beta' })
      .expect(201);
    const secondOrganization =
      secondOrganizationResponse.body as EntityResponse;

    await request(httpServer)
      .post(`/organizations/${secondOrganization.id}/users`)
      .send({ userId: user.id })
      .expect(201);

    await request(httpServer)
      .delete(`/organizations/${secondOrganization.id}/users/${user.id}`)
      .expect(200);

    await request(httpServer)
      .delete(`/organizations/${firstOrganization.id}/users/${user.id}`)
      .expect(400);
  });

  it('filters soft deleted users from list responses', async () => {
    const organizationResponse = await request(httpServer)
      .post('/organizations')
      .send({ name: 'Gamma', slug: 'gamma' })
      .expect(201);
    const organization = organizationResponse.body as EntityResponse;

    const userResponse = await request(httpServer)
      .post('/users')
      .send({
        email: 'soft-delete@example.com',
        organizationId: organization.id,
      })
      .expect(201);
    const user = userResponse.body as EntityResponse;

    await request(httpServer).delete(`/users/${user.id}`).expect(200);

    await request(httpServer).get('/users').expect(200).expect([]);
  });

  it('rejects malformed organization membership payloads before service calls', async () => {
    const organizationResponse = await request(httpServer)
      .post('/organizations')
      .send({ name: 'Delta', slug: 'delta' })
      .expect(201);
    const organization = organizationResponse.body as EntityResponse;

    await request(httpServer)
      .post(`/organizations/${organization.id}/users`)
      .send({})
      .expect(400);
  });

  it('rejects invalid user payloads at the validation layer', async () => {
    const organizationResponse = await request(httpServer)
      .post('/organizations')
      .send({ name: 'Echo', slug: 'echo' })
      .expect(201);
    const organization = organizationResponse.body as EntityResponse;

    await request(httpServer)
      .post('/users')
      .send({
        email: 'not-an-email',
        organizationId: organization.id,
      })
      .expect(400);
  });
});
