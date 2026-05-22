import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class UserRolesService {
  constructor(private readonly prisma: PrismaService) {}

  async assignRole(organizationId: bigint, userId: bigint, roleId: bigint) {
    const organizationUser = await this.prisma.organizationUser.findFirst({
      where: {
        organizationId,
        userId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!organizationUser) {
      throw new NotFoundException('User not found');
    }

    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        organizationId,
      },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    try {
      await this.prisma.userRole.create({
        data: {
          organizationUserId: organizationUser.id,
          roleId,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new BadRequestException('Role already assigned');
      }
      throw error;
    }

    return role;
  }

  async findAll(organizationId: bigint, userId: bigint) {
    const organizationUser = await this.prisma.organizationUser.findFirst({
      where: {
        organizationId,
        userId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!organizationUser) {
      throw new NotFoundException('User not found');
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: {
        organizationUserId: organizationUser.id,
      },
      include: {
        role: true,
      },
      orderBy: { id: 'asc' },
    });

    return userRoles.map((userRole) => userRole.role);
  }

  async removeRole(organizationId: bigint, userId: bigint, roleId: bigint) {
    const organizationUser = await this.prisma.organizationUser.findFirst({
      where: {
        organizationId,
        userId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!organizationUser) {
      throw new NotFoundException('User not found');
    }

    const userRole = await this.prisma.userRole.findFirst({
      where: {
        organizationUserId: organizationUser.id,
        role: {
          id: roleId,
          organizationId,
        },
      },
      include: {
        role: true,
      },
    });
    if (!userRole) {
      throw new NotFoundException('Role assignment not found');
    }

    await this.prisma.userRole.delete({
      where: { id: userRole.id },
    });

    return userRole.role;
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
