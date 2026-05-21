import {
  BadRequestException,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { MembershipsService } from '../../src/memberships/memberships.service';
import { OrganizationsService } from '../../src/organizations/organizations.service';
import { PrismaService } from '../../src/database/prisma.service';
import { UsersService } from '../../src/users/users.service';
import {
  createRealDbTestApp,
  truncateTestDatabase,
} from '../helpers/db-test-harness';

describe('MembershipsService (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let membershipsService: MembershipsService;
  let organizationsService: OrganizationsService;
  let usersService: UsersService;

  beforeAll(async () => {
    const testApp = await createRealDbTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
    membershipsService = app.get(MembershipsService);
    organizationsService = app.get(OrganizationsService);
    usersService = app.get(UsersService);
  });

  beforeEach(async () => {
    await truncateTestDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('reactivates a soft deleted membership instead of creating a duplicate row', async () => {
    const primaryOrganization = await prisma.organization.create({
      data: {
        name: 'Membership Primary',
        slug: 'membership-primary',
      },
    });
    const secondaryOrganization = await prisma.organization.create({
      data: {
        name: 'Membership Secondary',
        slug: 'membership-secondary',
      },
    });
    const user = await usersService.create({
      email: 'member@example.com',
      organizationId: primaryOrganization.id.toString(),
    });

    const createdMembership = await membershipsService.attachUser(
      secondaryOrganization.id,
      user.id,
    );

    await membershipsService.detachUser(secondaryOrganization.id, user.id);

    const reactivatedMembership = await membershipsService.attachUser(
      secondaryOrganization.id,
      user.id,
    );

    expect(reactivatedMembership.id).toBe(createdMembership.id);
    expect(reactivatedMembership.deletedAt).toBeNull();
  });

  it('persists role changes', async () => {
    const organization = await prisma.organization.create({
      data: {
        name: 'Membership Role Org',
        slug: 'membership-role-org',
      },
    });
    const user = await usersService.create({
      email: 'role@example.com',
      organizationId: organization.id.toString(),
    });

    const updatedMembership = await membershipsService.changeRole(
      organization.id,
      user.id,
      'admin',
    );

    expect(updatedMembership.role).toBe('admin');

    const persistedMembership = await prisma.membership.findFirstOrThrow({
      where: {
        organizationId: organization.id,
        userId: user.id,
        deletedAt: null,
      },
    });

    expect(persistedMembership.role).toBe('admin');
  });

  it('does not attach users to soft deleted organizations', async () => {
    const activeOrganization = await prisma.organization.create({
      data: {
        name: 'Membership Active Org',
        slug: 'membership-active-org',
      },
    });
    const deletedOrganization = await prisma.organization.create({
      data: {
        name: 'Membership Deleted Org',
        slug: 'membership-deleted-org',
      },
    });
    const user = await usersService.create({
      email: 'deleted-org@example.com',
      organizationId: activeOrganization.id.toString(),
    });

    await organizationsService.remove(deletedOrganization.id);

    await expect(
      membershipsService.attachUser(deletedOrganization.id, user.id),
    ).rejects.toThrow(NotFoundException);
  });

  it('does not attach soft deleted users to organizations', async () => {
    const firstOrganization = await prisma.organization.create({
      data: {
        name: 'Membership User Org 1',
        slug: 'membership-user-org-1',
      },
    });
    const secondOrganization = await prisma.organization.create({
      data: {
        name: 'Membership User Org 2',
        slug: 'membership-user-org-2',
      },
    });
    const user = await usersService.create({
      email: 'deleted-user@example.com',
      organizationId: firstOrganization.id.toString(),
    });

    await usersService.remove(user.id);

    await expect(
      membershipsService.attachUser(secondOrganization.id, user.id),
    ).rejects.toThrow(NotFoundException);
  });

  it('prevents removing the last active membership', async () => {
    const organization = await prisma.organization.create({
      data: {
        name: 'Membership Last Org',
        slug: 'membership-last-org',
      },
    });
    const user = await usersService.create({
      email: 'last-membership@example.com',
      organizationId: organization.id.toString(),
    });

    await expect(
      membershipsService.detachUser(organization.id, user.id),
    ).rejects.toThrow(BadRequestException);
  });
});
