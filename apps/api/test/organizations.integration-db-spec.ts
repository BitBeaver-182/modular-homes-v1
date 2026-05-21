import { INestApplication, NotFoundException } from '@nestjs/common';
import { OrganizationsService } from '../src/organizations/organizations.service';
import { PrismaService } from '../src/database/prisma.service';
import {
  applyTestMigrations,
  createRealDbTestApp,
  truncateTestDatabase,
} from './helpers/db-test-harness';

describe('OrganizationsService (integration:db)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let organizationsService: OrganizationsService;

  beforeAll(async () => {
    await applyTestMigrations();

    const testApp = await createRealDbTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
    organizationsService = app.get(OrganizationsService);
  });

  beforeEach(async () => {
    await truncateTestDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('enforces unique organization slugs in the real database', async () => {
    await organizationsService.create({ name: 'Acme', slug: 'acme' });

    await expect(
      organizationsService.create({ name: 'Acme Two', slug: 'acme' }),
    ).rejects.toThrow();
  });

  it('treats soft deleted organizations as not found', async () => {
    const organization = await organizationsService.create({
      name: 'Soft Delete Org',
      slug: 'soft-delete-org',
    });

    await organizationsService.remove(organization.id);

    await expect(organizationsService.findOne(organization.id)).rejects.toThrow(
      NotFoundException,
    );
  });
});
