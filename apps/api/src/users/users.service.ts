import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    if (!createUserDto.organizationId) {
      throw new BadRequestException('organizationId is required');
    }

    const organization = await this.prisma.organization.findFirst({
      where: { id: createUserDto.organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return this.prisma.$transaction(async (tx) => {
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
          organizationId: createUserDto.organizationId!,
        },
      });

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: {
          memberships: {
            where: { deletedAt: null },
          },
        },
      });
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      include: { memberships: { where: { deletedAt: null } } },
    });
  }

  async findOne(id: bigint) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { memberships: { where: { deletedAt: null } } },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: bigint, updateUserDto: UpdateUserDto) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: {
        email: updateUserDto.email,
        name: updateUserDto.name,
        avatarUrl: updateUserDto.avatarUrl,
      },
    });
  }

  async remove(id: bigint) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async detachFromOrganization(userId: bigint, organizationId: bigint) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, organizationId, deletedAt: null },
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
