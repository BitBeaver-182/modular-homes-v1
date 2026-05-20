import { Injectable, NotFoundException } from '@nestjs/common';
import { MembershipsService } from '../memberships/memberships.service';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipsService: MembershipsService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    return this.membershipsService.createUserWithMembership(createUserDto);
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
}
