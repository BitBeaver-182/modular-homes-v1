import { Injectable, NotFoundException } from '@nestjs/common';
import { MembershipsService } from '../memberships/memberships.service';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const activeMembershipInclude = {
  memberships: {
    where: { deletedAt: null },
    include: { organization: true },
  },
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipsService: MembershipsService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    return this.membershipsService.createUserWithMembership(createUserDto);
  }

  async findAll() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      include: activeMembershipInclude,
    });
  }

  async findOne(id: bigint) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: activeMembershipInclude,
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
      include: activeMembershipInclude,
    });
  }

  async remove(id: bigint) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: activeMembershipInclude,
    });
  }
}
