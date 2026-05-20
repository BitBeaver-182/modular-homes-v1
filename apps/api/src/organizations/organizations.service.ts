import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createOrganizationDto: CreateOrganizationDto) {
    return this.prisma.organization.create({ data: createOrganizationDto });
  }

  findAll() {
    return this.prisma.organization.findMany({ where: { deletedAt: null } });
  }

  async findOne(id: bigint) {
    const organization = await this.prisma.organization.findFirst({
      where: { id, deletedAt: null },
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    return organization;
  }

  async update(id: bigint, updateOrganizationDto: UpdateOrganizationDto) {
    await this.findOne(id);
    return this.prisma.organization.update({
      where: { id },
      data: {
        name: updateOrganizationDto.name,
        slug: updateOrganizationDto.slug,
      },
    });
  }

  async remove(id: bigint) {
    await this.findOne(id);
    return this.prisma.organization.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async assertUserBelongsToOrganization(
    organizationId: bigint,
    userId: bigint,
  ) {
    const membership = await this.prisma.membership.findFirst({
      where: { organizationId, userId, deletedAt: null },
      select: { id: true },
    });
    if (!membership) {
      throw new NotFoundException('User is not a member of organization');
    }
    return membership;
  }

  async attachUser(organizationId: bigint, userId: bigint) {
    await this.findOne(organizationId);
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
