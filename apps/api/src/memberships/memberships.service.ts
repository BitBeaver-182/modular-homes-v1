import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { parseBigIntId } from '../common/ids/parse-bigint-id';

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async createUserWithMembership(createUserDto: CreateUserDto) {
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
    const organization = await this.prisma.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.membership.findFirst({
      where: { organizationId, userId, deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException(
        'User is already a member of this organization',
      );
    }

    return this.prisma.membership.create({
      data: { organizationId, userId },
    });
  }

  async detachUser(organizationId: bigint, userId: bigint) {
    const membership = await this.prisma.membership.findFirst({
      where: { organizationId, userId, deletedAt: null },
      select: { id: true },
    });
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    const activeMembershipCount = await this.prisma.membership.count({
      where: { userId, deletedAt: null },
    });
    if (activeMembershipCount <= 1) {
      throw new BadRequestException(
        'User must belong to at least one organization',
      );
    }

    return this.prisma.membership.update({
      where: { id: membership.id },
      data: { deletedAt: new Date() },
    });
  }
}
