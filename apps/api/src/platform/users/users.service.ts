import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  OrganizationUsersService,
  scopedOrganizationUserInclude,
  type UserWithOrganizationContext,
} from '../organization-users/organization-users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationUsersService: OrganizationUsersService,
  ) {}

  async create(
    organizationId: bigint,
    createUserDto: CreateUserDto,
  ): Promise<UserWithOrganizationContext> {
    return this.organizationUsersService.createUserInOrganization(
      organizationId,
      createUserDto,
    );
  }

  async findAll(
    organizationId: bigint,
  ): Promise<UserWithOrganizationContext[]> {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        organizationUsers: {
          some: {
            organizationId,
            deletedAt: null,
          },
        },
      },
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
  }

  async findOne(
    organizationId: bigint,
    id: bigint,
  ): Promise<UserWithOrganizationContext> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
        organizationUsers: {
          some: {
            organizationId,
            deletedAt: null,
          },
        },
      },
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
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(
    organizationId: bigint,
    id: bigint,
    updateUserDto: UpdateUserDto,
  ): Promise<UserWithOrganizationContext> {
    await this.findOne(organizationId, id);
    return this.prisma.user.update({
      where: { id },
      data: {
        email: updateUserDto.email,
        name: updateUserDto.name,
        avatarUrl: updateUserDto.avatarUrl,
      },
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
  }

  async remove(organizationId: bigint, id: bigint) {
    await this.organizationUsersService.removeUserFromOrganization(
      organizationId,
      id,
    );
  }
}
