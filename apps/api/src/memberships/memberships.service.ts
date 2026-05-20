import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { parseBigIntId } from '../common/ids/parse-bigint-id';

type MembershipRole = 'owner' | 'admin' | 'member';

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
        throw new BadRequestException('Organization is not active');
      }

      const user = await tx.user.create({
        data: {
          email: createUserDto.email,
          name: createUserDto.name,
          avatarUrl: createUserDto.avatarUrl,
        },
      });

      await tx.membership.create({
        data: {
          userId: user.id,
          organizationId,
        },
      });

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: { memberships: { where: { deletedAt: null } } },
      });
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
          throw new BadRequestException('Organization is not active');
        }

        const user = await tx.user.findFirst({
          where: { id: userId, deletedAt: null },
          select: { id: true },
        });
        if (!user) {
          throw new BadRequestException('User is not active');
        }

        const existing = await tx.membership.findFirst({
          where: { organizationId, userId },
          select: { id: true, deletedAt: true },
        });
        if (existing) {
          if (existing.deletedAt) {
            return tx.membership.update({
              where: { id: existing.id },
              data: { deletedAt: null },
            });
          }
          throw new BadRequestException('Already a member');
        }

        return tx.membership.create({
          data: { organizationId, userId },
        });
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
        throw new NotFoundException('Membership not found');
      }

      const activeMembershipCount = await tx.membership.count({
        where: { userId, deletedAt: null },
      });
      if (activeMembershipCount <= 1) {
        throw new BadRequestException(
          'User must belong to at least one organization',
        );
      }

      return tx.membership.update({
        where: { id: membership.id },
        data: { deletedAt: new Date() },
      });
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
      throw new NotFoundException('Membership not found');
    }

    return this.prisma.membership.update({
      where: { id: membership.id },
      data: { role },
    });
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
