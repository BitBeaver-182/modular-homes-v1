import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

const scopedOrganizationUserInclude = {
  organizationUsers: {
    where: {
      deletedAt: null,
      status: 'active',
    },
    include: {
      organization: true,
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  },
} as const;

const membershipWithUserInclude = {
  user: true,
} as const;

export type UserWithOrganizationContext = Prisma.UserGetPayload<{
  include: {
    organizationUsers: {
      include: {
        organization: true;
        userRoles: {
          include: {
            role: true;
          };
        };
      };
    };
  };
}>;

export type OrganizationMembershipWithUser = Prisma.OrganizationUserGetPayload<{
  include: typeof membershipWithUserInclude;
}>;

@Injectable()
export class OrganizationUsersService {
  constructor(private readonly prisma: PrismaService) {}

  private async findActiveMembershipOrThrow(
    tx: Prisma.TransactionClient,
    organizationId: bigint,
    userId: bigint,
  ) {
    const membership = await tx.organizationUser.findFirst({
      where: {
        organizationId,
        userId,
        deletedAt: null,
        status: 'active',
      },
      select: {
        id: true,
        governanceRole: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('User not found');
    }

    return membership;
  }

  private async assertOrganizationExists(
    tx: Prisma.TransactionClient,
    organizationId: bigint,
  ) {
    const organization = await tx.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
      select: { id: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
  }

  private async findOrCreateUser(
    tx: Prisma.TransactionClient,
    createUserDto: CreateUserDto,
  ) {
    const existingUser = await tx.user.findUnique({
      where: { email: createUserDto.email },
      select: { id: true, deletedAt: true },
    });

    if (existingUser) {
      if (existingUser.deletedAt) {
        const reactivatedUser = await tx.user.update({
          where: { id: existingUser.id },
          data: {
            deletedAt: null,
            name: createUserDto.name,
            avatarUrl: createUserDto.avatarUrl,
          },
        });

        return reactivatedUser.id;
      }

      return existingUser.id;
    }

    const newUser = await tx.user.create({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        avatarUrl: createUserDto.avatarUrl,
      },
    });

    return newUser.id;
  }

  async createUserInOrganization(
    organizationId: bigint,
    createUserDto: CreateUserDto,
  ): Promise<UserWithOrganizationContext> {
    return this.prisma.$transaction(async (tx) => {
      await this.assertOrganizationExists(tx, organizationId);

      const userId = await this.findOrCreateUser(tx, createUserDto);

      const existingOrganizationUser = await tx.organizationUser.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
        select: { id: true, deletedAt: true, governanceRole: true },
      });

      const activeOrganizationUserCount = await tx.organizationUser.count({
        where: {
          organizationId,
          deletedAt: null,
          status: 'active',
        },
      });

      if (existingOrganizationUser) {
        if (existingOrganizationUser.deletedAt) {
          await tx.organizationUser.update({
            where: { id: existingOrganizationUser.id },
            data: {
              deletedAt: null,
              status: 'active',
              governanceRole:
                activeOrganizationUserCount === 0
                  ? 'owner'
                  : existingOrganizationUser.governanceRole,
            },
          });
        } else {
          throw new BadRequestException('User already belongs to organization');
        }
      } else {
        await tx.organizationUser.create({
          data: {
            organizationId,
            userId,
            governanceRole:
              activeOrganizationUserCount === 0 ? 'owner' : 'member',
            status: 'active',
          },
        });
      }

      return tx.user.findUniqueOrThrow({
        where: { id: userId },
        include: {
          organizationUsers: {
            ...scopedOrganizationUserInclude.organizationUsers,
            where: {
              organizationId,
              deletedAt: null,
              status: 'active',
            },
          },
        },
      });
    });
  }

  async findActiveOrganizationUser(organizationId: bigint, userId: bigint) {
    const organizationUser = await this.prisma.organizationUser.findFirst({
      where: {
        organizationId,
        userId,
        deletedAt: null,
        status: 'active',
      },
      include: {
        organization: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!organizationUser) {
      throw new NotFoundException('User not found');
    }

    return organizationUser;
  }

  async removeUserFromOrganization(organizationId: bigint, userId: bigint) {
    return this.prisma.$transaction(async (tx) => {
      const organizationUser = await this.findActiveMembershipOrThrow(
        tx,
        organizationId,
        userId,
      );

      if (organizationUser.governanceRole === 'owner') {
        const activeOwnerCount = await tx.organizationUser.count({
          where: {
            organizationId,
            deletedAt: null,
            status: 'active',
            governanceRole: 'owner',
          },
        });

        if (activeOwnerCount <= 1) {
          throw new BadRequestException(
            'Organization must have at least one active owner',
          );
        }
      }

      const activeOrganizationUserCount = await tx.organizationUser.count({
        where: {
          userId,
          deletedAt: null,
          status: 'active',
        },
      });

      const removedAt = new Date();

      await tx.organizationUser.update({
        where: { id: organizationUser.id },
        data: { deletedAt: removedAt, status: 'removed' },
      });

      if (activeOrganizationUserCount === 1) {
        await tx.user.update({
          where: { id: userId },
          data: { deletedAt: removedAt },
        });
      }
    });
  }

  async inviteUserToOrganization(
    organizationId: bigint,
    createUserDto: CreateUserDto,
  ): Promise<OrganizationMembershipWithUser> {
    return this.prisma.$transaction(async (tx) => {
      await this.assertOrganizationExists(tx, organizationId);

      const userId = await this.findOrCreateUser(tx, createUserDto);
      const existingOrganizationUser = await tx.organizationUser.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
        select: { id: true, deletedAt: true, status: true },
      });

      if (existingOrganizationUser) {
        if (existingOrganizationUser.deletedAt) {
          return tx.organizationUser.update({
            where: { id: existingOrganizationUser.id },
            data: {
              deletedAt: null,
              governanceRole: 'member',
              status: 'invited',
            },
            include: membershipWithUserInclude,
          });
        }

        throw new BadRequestException('User already belongs to organization');
      }

      return tx.organizationUser.create({
        data: {
          organizationId,
          userId,
          governanceRole: 'member',
          status: 'invited',
        },
        include: membershipWithUserInclude,
      });
    });
  }

  async activateMembership(
    organizationId: bigint,
    userId: bigint,
  ): Promise<OrganizationMembershipWithUser> {
    return this.prisma.$transaction(async (tx) => {
      const membership = await tx.organizationUser.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
        select: {
          id: true,
          deletedAt: true,
          governanceRole: true,
          status: true,
        },
      });

      if (
        !membership ||
        membership.deletedAt ||
        membership.status === 'removed'
      ) {
        throw new NotFoundException('User not found');
      }

      if (membership.status !== 'invited') {
        throw new BadRequestException('Membership is already active');
      }

      const activeOrganizationUserCount = await tx.organizationUser.count({
        where: {
          organizationId,
          deletedAt: null,
          status: 'active',
        },
      });

      return tx.organizationUser.update({
        where: { id: membership.id },
        data: {
          governanceRole:
            activeOrganizationUserCount === 0
              ? 'owner'
              : membership.governanceRole,
          status: 'active',
        },
        include: membershipWithUserInclude,
      });
    });
  }

  async grantOwner(organizationId: bigint, userId: bigint): Promise<void> {
    await this.prisma.organizationUser.updateMany({
      where: {
        organizationId,
        userId,
        deletedAt: null,
        status: 'active',
      },
      data: {
        governanceRole: 'owner',
      },
    });

    const updatedMembership = await this.prisma.organizationUser.findFirst({
      where: {
        organizationId,
        userId,
        deletedAt: null,
        status: 'active',
      },
      select: { id: true },
    });

    if (!updatedMembership) {
      throw new NotFoundException('User not found');
    }
  }

  async transferOwnership(
    organizationId: bigint,
    fromUserId: bigint,
    toUserId: bigint,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const fromMembership = await this.findActiveMembershipOrThrow(
        tx,
        organizationId,
        fromUserId,
      );
      const toMembership = await this.findActiveMembershipOrThrow(
        tx,
        organizationId,
        toUserId,
      );

      if (fromMembership.governanceRole !== 'owner') {
        throw new BadRequestException('Source user is not an owner');
      }

      await tx.organizationUser.update({
        where: { id: toMembership.id },
        data: {
          governanceRole: 'owner',
        },
      });

      await tx.organizationUser.update({
        where: { id: fromMembership.id },
        data: {
          governanceRole: 'member',
        },
      });
    });
  }
}

export { scopedOrganizationUserInclude };
