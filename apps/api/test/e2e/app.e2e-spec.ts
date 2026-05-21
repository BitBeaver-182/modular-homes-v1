import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/database/prisma.service';
import {
  applyTestMigrations,
  createRealDbTestApp,
  truncateTestDatabase,
} from '../helpers/db-test-harness';

describe('Membership lifecycle (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    await applyTestMigrations();

    const testApp = await createRealDbTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
  });

  beforeEach(async () => {
    await truncateTestDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('supports membership lifecycle with a last-membership guard', async () => {
    const firstOrganizationResponse = await request(app.getHttpServer())
      .post('/organizations')
      .send({ name: 'Acme', slug: 'acme' })
      .expect(201);

    const userResponse = await request(app.getHttpServer())
      .post('/users')
      .send({
        email: 'user@example.com',
        organizationId: firstOrganizationResponse.body.id,
      })
      .expect(201);

    const secondOrganizationResponse = await request(app.getHttpServer())
      .post('/organizations')
      .send({ name: 'Beta', slug: 'beta' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/organizations/${secondOrganizationResponse.body.id}/users`)
      .send({ userId: userResponse.body.id })
      .expect(201);

    await request(app.getHttpServer())
      .delete(
        `/organizations/${secondOrganizationResponse.body.id}/users/${userResponse.body.id}`,
      )
      .expect(200);

    await request(app.getHttpServer())
      .delete(
        `/organizations/${firstOrganizationResponse.body.id}/users/${userResponse.body.id}`,
      )
      .expect(400);
  });

  it('filters soft deleted users from list responses', async () => {
    const organizationResponse = await request(app.getHttpServer())
      .post('/organizations')
      .send({ name: 'Gamma', slug: 'gamma' })
      .expect(201);

    const userResponse = await request(app.getHttpServer())
      .post('/users')
      .send({
        email: 'soft-delete@example.com',
        organizationId: organizationResponse.body.id,
      })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/users/${userResponse.body.id}`)
      .expect(200);

    await request(app.getHttpServer()).get('/users').expect(200).expect([]);
  });

  it('rejects malformed organization membership payloads before service calls', async () => {
    const organizationResponse = await request(app.getHttpServer())
      .post('/organizations')
      .send({ name: 'Delta', slug: 'delta' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/organizations/${organizationResponse.body.id}/users`)
      .send({})
      .expect(400);
  });

  it('rejects invalid user payloads at the validation layer', async () => {
    const organizationResponse = await request(app.getHttpServer())
      .post('/organizations')
      .send({ name: 'Echo', slug: 'echo' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/users')
      .send({
        email: 'not-an-email',
        organizationId: organizationResponse.body.id,
      })
      .expect(400);
  });
});
