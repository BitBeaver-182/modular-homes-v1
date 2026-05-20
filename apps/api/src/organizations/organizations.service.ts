import { Injectable, NotFoundException } from '@nestjs/common';
import { MembershipsService } from '../memberships/memberships.service';
import { PrismaService } from '../database/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipsService: MembershipsService,
  ) {}

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

  async attachUser(organizationId: bigint, userId: bigint) {
    return this.membershipsService.attachUser(organizationId, userId);
  }

  async detachUser(organizationId: bigint, userId: bigint) {
    return this.membershipsService.detachUser(organizationId, userId);
  }
}
