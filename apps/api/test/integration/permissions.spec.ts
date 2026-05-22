import {
  BadRequestException,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../src/database/prisma.service';
import { PermissionsService } from '../../src/permissions/permissions.service';
import {
  createRealDbTestApp,
  truncateTestDatabase,
} from '../helpers/db-test-harness';

describe('PermissionsService (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let permissionsService: PermissionsService;

  beforeAll(async () => {
    const testApp = await createRealDbTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
    permissionsService = app.get(PermissionsService);
  });

  beforeEach(async () => {
    await truncateTestDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('enforces globally unique permission keys', async () => {
    await permissionsService.create({
      key: 'catalog.manage',
      description: 'Manage catalog',
    });

    await expect(
      permissionsService.create({ key: 'catalog.manage' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates, lists, and deletes permissions against the real database', async () => {
    const createdPermission = await permissionsService.create({
      key: 'users.manage',
      description: 'Manage users',
    });

    const permissions = await permissionsService.findAll();
    expect(permissions.map((permission) => permission.key)).toEqual([
      'users.manage',
    ]);

    const updatedPermission = await permissionsService.update(
      createdPermission.id,
      {
        key: 'users.admin',
        description: 'Administer users',
      },
    );
    expect(updatedPermission.key).toBe('users.admin');

    await permissionsService.remove(createdPermission.id);

    await expect(
      permissionsService.findOne(createdPermission.id),
    ).rejects.toThrow(NotFoundException);
  });
});
