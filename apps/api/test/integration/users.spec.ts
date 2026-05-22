import { INestApplication, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../src/database/prisma.service';
import { UsersService } from '../../src/platform/users/users.service';
import { UserRolesService } from '../../src/platform/user-roles/user-roles.service';
import { RolesService } from '../../src/platform/roles/roles.service';
import {
  createRealDbTestApp,
  truncateTestDatabase,
} from '../helpers/db-test-harness';

describe('UsersService (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let usersService: UsersService;
  let rolesService: RolesService;
  let userRolesService: UserRolesService;

  beforeAll(async () => {
    const testApp = await createRealDbTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
    usersService = app.get(UsersService);
    rolesService = app.get(RolesService);
    userRolesService = app.get(UserRolesService);
  });

  beforeEach(async () => {
    await truncateTestDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a user linked to the scoped organization', async () => {
    const organization = await prisma.organization.create({
      data: {
        name: 'Users Create Org',
        slug: 'users-create-org',
      },
    });

    const user = await usersService.create(organization.id, {
      email: 'john@example.com',
      name: 'John',
    });

    expect(user.email).toBe('john@example.com');
    expect(user.organizationUsers).toHaveLength(1);
    expect(user.organizationUsers[0]?.organizationId).toBe(organization.id);
  });

  it('reuses the same user across multiple organizations', async () => {
    const firstOrganization = await prisma.organization.create({
      data: {
        name: 'Users Unique 1',
        slug: 'users-unique-1',
      },
    });
    const secondOrganization = await prisma.organization.create({
      data: {
        name: 'Users Unique 2',
        slug: 'users-unique-2',
      },
    });

    const firstUser = await usersService.create(firstOrganization.id, {
      email: 'duplicate@example.com',
    });

    const secondUser = await usersService.create(secondOrganization.id, {
      email: 'duplicate@example.com',
    });

    expect(secondUser.id).toBe(firstUser.id);

    const organizationUsers = await prisma.organizationUser.findMany({
      where: {
        userId: firstUser.id,
        deletedAt: null,
      },
    });
    expect(organizationUsers).toHaveLength(2);
  });

  it('scopes reads and roles to the requested organization', async () => {
    const organizationA = await prisma.organization.create({
      data: {
        name: 'Users Scope A',
        slug: 'users-scope-a',
      },
    });
    const organizationB = await prisma.organization.create({
      data: {
        name: 'Users Scope B',
        slug: 'users-scope-b',
      },
    });
    const user = await usersService.create(organizationA.id, {
      email: 'scoped@example.com',
    });
    await usersService.create(organizationB.id, {
      email: 'scoped@example.com',
    });

    const roleA = await rolesService.create(organizationA.id, {
      name: 'Estimator',
    });
    const roleB = await rolesService.create(organizationB.id, {
      name: 'Sales',
    });
    await userRolesService.assignRole(organizationA.id, user.id, roleA.id);
    await userRolesService.assignRole(organizationB.id, user.id, roleB.id);

    const scopedUserA = await usersService.findOne(organizationA.id, user.id);

    expect(scopedUserA.organizationUsers).toHaveLength(1);
    expect(scopedUserA.organizationUsers[0]?.organizationId).toBe(
      organizationA.id,
    );
    expect(scopedUserA.organizationUsers[0]?.userRoles[0]?.role.name).toBe(
      'Estimator',
    );

    await expect(usersService.findOne(999n, user.id)).rejects.toThrow(
      NotFoundException,
    );
  });
});
