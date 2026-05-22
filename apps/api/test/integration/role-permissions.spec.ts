import {
  BadRequestException,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../src/database/prisma.service';
import { PermissionsService } from '../../src/permissions/permissions.service';
import { RolePermissionsService } from '../../src/role-permissions/role-permissions.service';
import { RolesService } from '../../src/roles/roles.service';
import {
  createRealDbTestApp,
  truncateTestDatabase,
} from '../helpers/db-test-harness';

describe('RolePermissionsService (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let rolesService: RolesService;
  let permissionsService: PermissionsService;
  let rolePermissionsService: RolePermissionsService;

  beforeAll(async () => {
    const testApp = await createRealDbTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
    rolesService = app.get(RolesService);
    permissionsService = app.get(PermissionsService);
    rolePermissionsService = app.get(RolePermissionsService);
  });

  beforeEach(async () => {
    await truncateTestDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('assigns, lists, and removes permissions for an organization-scoped role', async () => {
    const organization = await prisma.organization.create({
      data: { name: 'Role Permission Org', slug: 'role-permission-org' },
    });
    const role = await rolesService.create(organization.id, {
      name: 'Catalog Manager',
    });
    const permission = await permissionsService.create({
      key: 'catalog.manage',
      description: 'Manage catalog',
    });

    const assignedPermission = await rolePermissionsService.assignPermission(
      organization.id,
      role.id,
      permission.id,
    );
    expect(assignedPermission.id).toBe(permission.id);

    const permissions = await rolePermissionsService.findAll(
      organization.id,
      role.id,
    );
    expect(permissions.map((item) => item.key)).toEqual(['catalog.manage']);

    const removedPermission = await rolePermissionsService.removePermission(
      organization.id,
      role.id,
      permission.id,
    );
    expect(removedPermission.id).toBe(permission.id);

    expect(
      await rolePermissionsService.findAll(organization.id, role.id),
    ).toEqual([]);
  });

  it('rejects duplicate and cross-organization permission assignments', async () => {
    const organizationA = await prisma.organization.create({
      data: { name: 'Role Permission A', slug: 'role-permission-a' },
    });
    const organizationB = await prisma.organization.create({
      data: { name: 'Role Permission B', slug: 'role-permission-b' },
    });
    const roleA = await rolesService.create(organizationA.id, {
      name: 'Admin',
    });
    const roleB = await rolesService.create(organizationB.id, {
      name: 'Viewer',
    });
    const permission = await permissionsService.create({
      key: 'users.manage',
    });

    await rolePermissionsService.assignPermission(
      organizationA.id,
      roleA.id,
      permission.id,
    );

    await expect(
      rolePermissionsService.assignPermission(
        organizationA.id,
        roleA.id,
        permission.id,
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      rolePermissionsService.assignPermission(
        organizationA.id,
        roleB.id,
        permission.id,
      ),
    ).rejects.toThrow(NotFoundException);

    await expect(
      rolePermissionsService.assignPermission(
        organizationA.id,
        roleA.id,
        9999n,
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
