import {
  BadRequestException,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../src/database/prisma.service';
import { RolesService } from '../../src/platform/roles/roles.service';
import {
  createRealDbTestApp,
  truncateTestDatabase,
} from '../helpers/db-test-harness';

describe('RolesService (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let rolesService: RolesService;

  beforeAll(async () => {
    const testApp = await createRealDbTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
    rolesService = app.get(RolesService);
  });

  beforeEach(async () => {
    await truncateTestDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('enforces unique role names within the same organization only', async () => {
    const organizationA = await prisma.organization.create({
      data: { name: 'Roles Org A', slug: 'roles-org-a' },
    });
    const organizationB = await prisma.organization.create({
      data: { name: 'Roles Org B', slug: 'roles-org-b' },
    });

    await rolesService.create(organizationA.id, { name: 'Admin' });

    await expect(
      rolesService.create(organizationA.id, { name: 'Admin' }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      rolesService.create(organizationB.id, { name: 'Admin' }),
    ).resolves.toMatchObject({ name: 'Admin' });
  });

  it('scopes role reads, updates, and deletes to the requested organization', async () => {
    const organizationA = await prisma.organization.create({
      data: { name: 'Roles Scope A', slug: 'roles-scope-a' },
    });
    const organizationB = await prisma.organization.create({
      data: { name: 'Roles Scope B', slug: 'roles-scope-b' },
    });

    const role = await rolesService.create(organizationA.id, {
      name: 'Estimator',
      description: 'Initial description',
    });

    await expect(
      rolesService.findOne(organizationB.id, role.id),
    ).rejects.toThrow(NotFoundException);

    const updatedRole = await rolesService.update(organizationA.id, role.id, {
      name: 'Senior Estimator',
      description: 'Updated description',
    });
    expect(updatedRole.name).toBe('Senior Estimator');

    await expect(
      rolesService.remove(organizationB.id, role.id),
    ).rejects.toThrow(NotFoundException);

    await rolesService.remove(organizationA.id, role.id);

    await expect(
      rolesService.findOne(organizationA.id, role.id),
    ).rejects.toThrow(NotFoundException);
  });
});
