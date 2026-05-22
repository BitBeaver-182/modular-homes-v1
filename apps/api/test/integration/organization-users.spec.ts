import {
  BadRequestException,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationUsersService } from '../../src/platform/organization-users/organization-users.service';
import { PrismaService } from '../../src/database/prisma.service';
import {
  createRealDbTestApp,
  truncateTestDatabase,
} from '../helpers/db-test-harness';

describe('OrganizationUsersService (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let organizationUsersService: OrganizationUsersService;

  beforeAll(async () => {
    const testApp = await createRealDbTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
    organizationUsersService = app.get(OrganizationUsersService);
  });

  beforeEach(async () => {
    await truncateTestDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('reactivates a soft deleted org-user link instead of creating a duplicate row', async () => {
    const organization = await prisma.organization.create({
      data: {
        name: 'Org User Reactivate',
        slug: 'org-user-reactivate',
      },
    });

    const user = await organizationUsersService.createUserInOrganization(
      organization.id,
      {
        email: 'member@example.com',
      },
    );

    await prisma.organization.create({
      data: {
        name: 'Org User Helper',
        slug: 'org-user-helper',
      },
    });

    await prisma.organizationUser.update({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organization.id,
        },
      },
      data: { deletedAt: new Date() },
    });

    const reactivatedUser =
      await organizationUsersService.createUserInOrganization(organization.id, {
        email: 'member@example.com',
      });

    const activeLinks = await prisma.organizationUser.findMany({
      where: {
        userId: user.id,
        organizationId: organization.id,
      },
    });

    expect(reactivatedUser.id).toBe(user.id);
    expect(activeLinks).toHaveLength(1);
    expect(activeLinks[0]?.deletedAt).toBeNull();
  });

  it('does not create org-user links for deleted organizations', async () => {
    const organization = await prisma.organization.create({
      data: {
        name: 'Deleted Org',
        slug: 'deleted-org',
        deletedAt: new Date(),
      },
    });

    await expect(
      organizationUsersService.createUserInOrganization(organization.id, {
        email: 'member@example.com',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('prevents removing the last active organization for a user', async () => {
    const organization = await prisma.organization.create({
      data: {
        name: 'Last Org',
        slug: 'last-org',
      },
    });
    const user = await organizationUsersService.createUserInOrganization(
      organization.id,
      {
        email: 'last@example.com',
      },
    );

    await expect(
      organizationUsersService.removeUserFromOrganization(
        organization.id,
        user.id,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
