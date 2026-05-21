import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { parseBigIntId } from '../common/ids/parse-bigint-id';

type MembershipRole = 'owner' | 'admin' | 'member';

const activeMembershipInclude = {
  memberships: {
    where: { deletedAt: null },
    include: { organization: true },
  },
} as const;

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async createUserWithMembership(createUserDto: CreateUserDto) {
    if (createUserDto.organizationId == null) {
      throw new BadRequestException('User must belong to an organization');
    }

    const organizationId = parseBigIntId(
      createUserDto.organizationId,
      'organizationId',
    );

    return this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.findFirst({
        where: { id: organizationId, deletedAt: null },
        select: { id: true },
      });
      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      // Check if user already exists
      const existingUser = await tx.user.findUnique({
        where: { email: createUserDto.email },
        select: { id: true, deletedAt: true },
      });

      let userId: bigint;

      if (existingUser) {
        if (!existingUser.deletedAt) {
          throw new BadRequestException('User already exists');
        }

        // Reactivate soft-deleted user
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
        // Create new user
        const newUser = await tx.user.create({
          data: {
            email: createUserDto.email,
            name: createUserDto.name,
            avatarUrl: createUserDto.avatarUrl,
          },
        });
        userId = newUser.id;
      }

      // Handle membership (restore or create)
      const existingMembership = await tx.membership.findFirst({
        where: { userId, organizationId },
        select: { id: true, deletedAt: true },
      });

      if (existingMembership) {
        if (existingMembership.deletedAt) {
          await tx.membership.update({
            where: { id: existingMembership.id },
            data: { deletedAt: null },
          });
        }
        // If already active, we just continue (or could throw if that's preferred,
        // but for re-onboarding to the same org, being active is fine).
      } else {
        await tx.membership.create({
          data: { userId, organizationId },
        });
      }

      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        include: activeMembershipInclude,
      });

      return user;
    });
  }

  async attachUser(organizationId: bigint, userId: bigint) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const organization = await tx.organization.findFirst({
          where: { id: organizationId, deletedAt: null },
          select: { id: true },
        });
        if (!organization) {
          throw new NotFoundException('Organization not found');
        }

        const user = await tx.user.findFirst({
          where: { id: userId, deletedAt: null },
          select: { id: true },
        });
        if (!user) {
          throw new NotFoundException('User not found');
        }

        const existing = await tx.membership.findFirst({
          where: { organizationId, userId },
          select: { id: true, deletedAt: true },
        });
        if (existing) {
          if (existing.deletedAt) {
            const membership = await tx.membership.update({
              where: { id: existing.id },
              data: { deletedAt: null },
            });
            return membership;
          }
          throw new BadRequestException('Already a member');
        }

        const membership = await tx.membership.create({
          data: { organizationId, userId },
        });
        return membership;
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new BadRequestException('Already a member');
      }
      throw error;
    }
  }

  async detachUser(organizationId: bigint, userId: bigint) {
    return this.prisma.$transaction(async (tx) => {
      const membership = await tx.membership.findFirst({
        where: { organizationId, userId, deletedAt: null },
        select: { id: true },
      });
      if (!membership) {
        throw new NotFoundException('User or Organization not found');
      }

      const activeMembershipCount = await tx.membership.count({
        where: { userId, deletedAt: null },
      });
      if (activeMembershipCount <= 1) {
        throw new BadRequestException(
          'User must belong to at least one organization',
        );
      }

      const updatedMembership = await tx.membership.update({
        where: { id: membership.id },
        data: { deletedAt: new Date() },
      });
      return updatedMembership;
    });
  }

  async changeRole(
    organizationId: bigint,
    userId: bigint,
    role: MembershipRole,
  ) {
    const membership = await this.prisma.membership.findFirst({
      where: { organizationId, userId, deletedAt: null },
      select: { id: true },
    });
    if (!membership) {
      throw new NotFoundException('User or Organization not found');
    }

    const updatedMembership = await this.prisma.membership.update({
      where: { id: membership.id },
      data: { role },
    });
    return updatedMembership;
  }
}

function isUniqueConstraintError(error: unknown): error is { code: 'P2002' } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}
