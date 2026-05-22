import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: bigint, createRoleDto: CreateRoleDto) {
    try {
      return await this.prisma.role.create({
        data: {
          organizationId,
          name: createRoleDto.name,
          description: createRoleDto.description,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new BadRequestException('Role name already exists');
      }
      throw error;
    }
  }

  findAll(organizationId: bigint) {
    return this.prisma.role.findMany({
      where: { organizationId },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(organizationId: bigint, id: bigint) {
    const role = await this.prisma.role.findFirst({
      where: { id, organizationId },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async update(
    organizationId: bigint,
    id: bigint,
    updateRoleDto: UpdateRoleDto,
  ) {
    await this.findOne(organizationId, id);

    try {
      return await this.prisma.role.update({
        where: { id },
        data: {
          name: updateRoleDto.name,
          description: updateRoleDto.description,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new BadRequestException('Role name already exists');
      }
      throw error;
    }
  }

  async remove(organizationId: bigint, id: bigint) {
    await this.findOne(organizationId, id);
    return this.prisma.role.delete({
      where: { id },
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
