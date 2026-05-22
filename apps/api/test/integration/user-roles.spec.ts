import {
  BadRequestException,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../src/database/prisma.service';
import { RolesService } from '../../src/platform/roles/roles.service';
import { UserRolesService } from '../../src/platform/user-roles/user-roles.service';
import { UsersService } from '../../src/platform/users/users.service';
import {
  createRealDbTestApp,
  truncateTestDatabase,
} from '../helpers/db-test-harness';

describe('UserRolesService (integration)', () => {
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

  it('assigns, lists, and removes user roles within the active organization', async () => {
    const organization = await prisma.organization.create({
      data: { name: 'User Roles Org', slug: 'user-roles-org' },
    });
    const user = await usersService.create(organization.id, {
      email: 'roles@example.com',
    });
    const role = await rolesService.create(organization.id, {
      name: 'Admin',
    });

    const assignedRole = await userRolesService.assignRole(
      organization.id,
      user.id,
      role.id,
    );
    expect(assignedRole.id).toBe(role.id);

    const roles = await userRolesService.findAll(organization.id, user.id);
    expect(roles.map((item) => item.name)).toEqual(['Admin']);

    const removedRole = await userRolesService.removeRole(
      organization.id,
      user.id,
      role.id,
    );
    expect(removedRole.id).toBe(role.id);

    expect(await userRolesService.findAll(organization.id, user.id)).toEqual(
      [],
    );
  });

  it('rejects duplicate and cross-organization role assignments', async () => {
    const organizationA = await prisma.organization.create({
      data: { name: 'User Roles A', slug: 'user-roles-a' },
    });
    const organizationB = await prisma.organization.create({
      data: { name: 'User Roles B', slug: 'user-roles-b' },
    });
    const user = await usersService.create(organizationA.id, {
      email: 'cross-role@example.com',
    });
    await usersService.create(organizationB.id, {
      email: 'cross-role@example.com',
    });
    const roleA = await rolesService.create(organizationA.id, {
      name: 'Estimator',
    });
    const roleB = await rolesService.create(organizationB.id, {
      name: 'Sales',
    });

    await userRolesService.assignRole(organizationA.id, user.id, roleA.id);

    await expect(
      userRolesService.assignRole(organizationA.id, user.id, roleA.id),
    ).rejects.toThrow(BadRequestException);

    await expect(
      userRolesService.assignRole(organizationA.id, user.id, roleB.id),
    ).rejects.toThrow(NotFoundException);

    await expect(
      userRolesService.assignRole(organizationB.id, 9999n, roleB.id),
    ).rejects.toThrow(NotFoundException);
  });
});
