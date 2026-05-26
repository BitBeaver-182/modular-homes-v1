import { INestApplication, NotFoundException } from '@nestjs/common';
import { OrganizationsService } from '../../src/global/organizations/organizations.service';
import { PrismaService } from '../../src/database/prisma.service';
import {
  createRealDbTestApp,
  truncateTestDatabase,
} from '../helpers/db-test-harness';

describe('OrganizationsService (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let organizationsService: OrganizationsService;

  beforeAll(async () => {
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
    const owner = await prisma.user.create({
      data: { email: 'acme-owner@example.com' },
    });
    await organizationsService.createForUser(owner.id, {
      name: 'Acme',
      slug: 'acme',
    });

    await expect(
      organizationsService.createForUser(owner.id, {
        name: 'Acme Two',
        slug: 'acme',
      }),
    ).rejects.toThrow();
  });

  it('treats soft deleted organizations as not found', async () => {
    const owner = await prisma.user.create({
      data: { email: 'soft-delete-owner@example.com' },
    });
    const organization = await organizationsService.createForUser(owner.id, {
      name: 'Soft Delete Org',
      slug: 'soft-delete-org',
    });

    await organizationsService.removeForUser(owner.id, organization.id);

    await expect(organizationsService.findOne(organization.id)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('creates the creator as the first active owner membership', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner-membership@example.com' },
    });

    const organization = await organizationsService.createForUser(owner.id, {
      name: 'Owned Org',
      slug: 'owned-org',
    });

    const membership = await prisma.organizationUser.findUniqueOrThrow({
      where: {
        userId_organizationId: {
          userId: owner.id,
          organizationId: organization.id,
        },
      },
    });

    expect(membership.governanceRole).toBe('owner');
    expect(membership.status).toBe('active');
  });
});
