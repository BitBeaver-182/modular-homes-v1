import { INestApplication, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../src/database/prisma.service';
import { UsersService } from '../../src/users/users.service';
import {
  applyTestMigrations,
  createRealDbTestApp,
  truncateTestDatabase,
} from '../helpers/db-test-harness';
import { createOrganization } from '../helpers/db-factories';

describe('UsersService (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let usersService: UsersService;

  beforeAll(async () => {
    applyTestMigrations();

    const testApp = await createRealDbTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
    usersService = app.get(UsersService);
  });

  beforeEach(async () => {
    await truncateTestDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a user with an initial membership in the requested organization', async () => {
    const organization = await createOrganization(prisma, {
      slug: 'users-create-org',
    });

    const user = await usersService.create({
      email: 'john@example.com',
      organizationId: organization.id.toString(),
      name: 'John',
    });

    expect(user.email).toBe('john@example.com');
    expect(user.memberships).toHaveLength(1);
    expect(user.memberships[0]?.organizationId).toBe(organization.id);
  });

  it('enforces unique email addresses in the real database', async () => {
    const firstOrganization = await createOrganization(prisma, {
      slug: 'users-unique-1',
    });
    const secondOrganization = await createOrganization(prisma, {
      slug: 'users-unique-2',
    });

    await usersService.create({
      email: 'duplicate@example.com',
      organizationId: firstOrganization.id.toString(),
    });

    await expect(
      usersService.create({
        email: 'duplicate@example.com',
        organizationId: secondOrganization.id.toString(),
      }),
    ).rejects.toThrow();
  });

  it('treats soft deleted users as not found', async () => {
    const organization = await createOrganization(prisma, {
      slug: 'users-soft-delete-org',
    });
    const user = await usersService.create({
      email: 'soft-delete@example.com',
      organizationId: organization.id.toString(),
    });

    await usersService.remove(user.id);

    await expect(usersService.findOne(user.id)).rejects.toThrow(
      NotFoundException,
    );
  });
});
