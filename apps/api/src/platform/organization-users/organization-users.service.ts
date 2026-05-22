import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '../../generated/prisma';
import { CreateUserDto } from '../users/dto/create-user.dto';

const scopedOrganizationUserInclude = {
  organizationUsers: {
    where: {
      deletedAt: null,
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

@Injectable()
export class OrganizationUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUserInOrganization(
    organizationId: bigint,
    createUserDto: CreateUserDto,
  ): Promise<UserWithOrganizationContext> {
    return this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.findFirst({
        where: { id: organizationId, deletedAt: null },
        select: { id: true },
      });
      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      const existingUser = await tx.user.findUnique({
        where: { email: createUserDto.email },
        select: { id: true, deletedAt: true },
      });

      let userId: bigint;

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
          userId = reactivatedUser.id;
        } else {
          userId = existingUser.id;
        }
      } else {
        const newUser = await tx.user.create({
          data: {
            email: createUserDto.email,
            name: createUserDto.name,
            avatarUrl: createUserDto.avatarUrl,
          },
        });
        userId = newUser.id;
      }

      const existingOrganizationUser = await tx.organizationUser.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
        select: { id: true, deletedAt: true },
      });

      if (existingOrganizationUser) {
        if (existingOrganizationUser.deletedAt) {
          await tx.organizationUser.update({
            where: { id: existingOrganizationUser.id },
            data: { deletedAt: null },
          });
        } else {
          throw new BadRequestException('User already belongs to organization');
        }
      } else {
        await tx.organizationUser.create({
          data: { organizationId, userId },
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
      const organizationUser = await tx.organizationUser.findFirst({
        where: {
          organizationId,
          userId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (!organizationUser) {
        throw new NotFoundException('User not found');
      }

      const activeOrganizationUserCount = await tx.organizationUser.count({
        where: {
          userId,
          deletedAt: null,
        },
      });

      if (activeOrganizationUserCount <= 1) {
        throw new BadRequestException(
          'User must belong to at least one organization',
        );
      }

      await tx.organizationUser.update({
        where: { id: organizationUser.id },
        data: { deletedAt: new Date() },
      });
    });
  }
}

export { scopedOrganizationUserInclude };
