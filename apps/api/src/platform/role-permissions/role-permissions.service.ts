import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RolePermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async assignPermission(
    organizationId: bigint,
    roleId: bigint,
    permissionId: bigint,
  ) {
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        organizationId,
      },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    try {
      await this.prisma.rolePermission.create({
        data: {
          roleId,
          permissionId,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new BadRequestException('Permission already assigned');
      }
      throw error;
    }

    return permission;
  }

  async findAll(organizationId: bigint, roleId: bigint) {
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        organizationId,
      },
      select: { id: true },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      },
      orderBy: { id: 'asc' },
    });

    return rolePermissions.map((rolePermission) => rolePermission.permission);
  }

  async removePermission(
    organizationId: bigint,
    roleId: bigint,
    permissionId: bigint,
  ) {
    const rolePermission = await this.prisma.rolePermission.findFirst({
      where: {
        roleId,
        permissionId,
        role: {
          organizationId,
        },
      },
      include: {
        permission: true,
      },
    });
    if (!rolePermission) {
      throw new NotFoundException('Role permission not found');
    }

    await this.prisma.rolePermission.delete({
      where: { id: rolePermission.id },
    });

    return rolePermission.permission;
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
