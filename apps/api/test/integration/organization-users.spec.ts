import { INestApplication, NotFoundException } from '@nestjs/common';
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
      data: { deletedAt: new Date(), status: 'removed' },
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
    expect(activeLinks[0]?.status).toBe('active');
  });

  it('first membership in an organization is created as owner', async () => {
    const organization = await prisma.organization.create({
      data: {
        name: 'First Owner Org',
        slug: 'first-owner-org',
      },
    });

    const user = await organizationUsersService.createUserInOrganization(
      organization.id,
      {
        email: 'owner@example.com',
      },
    );

    const membership = await prisma.organizationUser.findUniqueOrThrow({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organization.id,
        },
      },
    });

    expect(membership.governanceRole).toBe('owner');
    expect(membership.status).toBe('active');
  });

  it('subsequent memberships in an organization are created as member', async () => {
    const organization = await prisma.organization.create({
      data: {
        name: 'Subsequent Member Org',
        slug: 'subsequent-member-org',
      },
    });

    await organizationUsersService.createUserInOrganization(organization.id, {
      email: 'owner@example.com',
    });
    const secondUser = await organizationUsersService.createUserInOrganization(
      organization.id,
      {
        email: 'member@example.com',
      },
    );

    const membership = await prisma.organizationUser.findUniqueOrThrow({
      where: {
        userId_organizationId: {
          userId: secondUser.id,
          organizationId: organization.id,
        },
      },
    });

    expect(membership.governanceRole).toBe('member');
    expect(membership.status).toBe('active');
  });

  it('soft deleted membership keeps historical governance role and status', async () => {
    const organizationA = await prisma.organization.create({
      data: {
        name: 'Historical A',
        slug: 'historical-a',
      },
    });
    const organizationB = await prisma.organization.create({
      data: {
        name: 'Historical B',
        slug: 'historical-b',
      },
    });

    const user = await organizationUsersService.createUserInOrganization(
      organizationA.id,
      {
        email: 'history@example.com',
      },
    );
    await organizationUsersService.createUserInOrganization(organizationB.id, {
      email: 'history@example.com',
    });

    await organizationUsersService.removeUserFromOrganization(
      organizationA.id,
      user.id,
    );

    const membership = await prisma.organizationUser.findUniqueOrThrow({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organizationA.id,
        },
      },
    });

    expect(membership.deletedAt).toBeInstanceOf(Date);
    expect(membership.governanceRole).toBe('owner');
    expect(membership.status).toBe('removed');
  });

  it('removing a membership does not delete the global user when another active membership exists', async () => {
    const organizationA = await prisma.organization.create({
      data: {
        name: 'Removal A',
        slug: 'removal-a',
      },
    });
    const organizationB = await prisma.organization.create({
      data: {
        name: 'Removal B',
        slug: 'removal-b',
      },
    });

    const user = await organizationUsersService.createUserInOrganization(
      organizationA.id,
      {
        email: 'multi-org@example.com',
      },
    );
    await organizationUsersService.createUserInOrganization(organizationB.id, {
      email: 'multi-org@example.com',
    });

    await organizationUsersService.removeUserFromOrganization(
      organizationA.id,
      user.id,
    );

    const removedMembership = await prisma.organizationUser.findUniqueOrThrow({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organizationA.id,
        },
      },
    });
    const persistedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });

    expect(removedMembership.deletedAt).toBeInstanceOf(Date);
    expect(removedMembership.status).toBe('removed');
    expect(persistedUser.deletedAt).toBeNull();
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

  it('removing the last active membership soft deletes the global user', async () => {
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

    await organizationUsersService.removeUserFromOrganization(
      organization.id,
      user.id,
    );

    const removedMembership = await prisma.organizationUser.findUniqueOrThrow({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organization.id,
        },
      },
    });
    const removedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });

    expect(removedMembership.deletedAt).toBeInstanceOf(Date);
    expect(removedMembership.status).toBe('removed');
    expect(removedUser.deletedAt).toBeInstanceOf(Date);
  });
});
