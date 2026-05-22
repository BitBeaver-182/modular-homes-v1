import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPermissionDto: CreatePermissionDto) {
    try {
      return await this.prisma.permission.create({
        data: createPermissionDto,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new BadRequestException('Permission key already exists');
      }
      throw error;
    }
  }

  findAll() {
    return this.prisma.permission.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: bigint) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    return permission;
  }

  async update(id: bigint, updatePermissionDto: UpdatePermissionDto) {
    await this.findOne(id);

    try {
      return await this.prisma.permission.update({
        where: { id },
        data: updatePermissionDto,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new BadRequestException('Permission key already exists');
      }
      throw error;
    }
  }

  async remove(id: bigint) {
    await this.findOne(id);
    return this.prisma.permission.delete({
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
