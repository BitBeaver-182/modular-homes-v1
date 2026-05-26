import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  createForUser(userId: bigint, createOrganizationDto: CreateOrganizationDto) {
    return this.prisma
      .$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: createOrganizationDto,
        });

        await tx.organizationUser.create({
          data: {
            organizationId: organization.id,
            userId,
            governanceRole: 'owner',
            status: 'active',
          },
        });

        return organization;
      })
      .catch((error: unknown) => {
        if (isUniqueConstraintError(error)) {
          throw new BadRequestException('Organization slug already exists');
        }
        throw error;
      });
  }

  findAll() {
    return this.prisma.organization.findMany({
      where: { deletedAt: null },
    });
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

  async removeForUser(userId: bigint, id: bigint) {
    await this.findOne(id);
    const ownerMembership = await this.prisma.organizationUser.findFirst({
      where: {
        organizationId: id,
        userId,
        deletedAt: null,
        status: 'active',
        governanceRole: 'owner',
      },
      select: { id: true },
    });

    if (!ownerMembership) {
      throw new BadRequestException('Owner access required');
    }

    const deletedAt = new Date();
    return this.prisma.$transaction(async (tx) => {
      await tx.organizationInvitation.updateMany({
        where: {
          organizationId: id,
          deletedAt: null,
        },
        data: {
          deletedAt,
          status: 'revoked',
          revokedAt: deletedAt,
        },
      });

      await tx.organizationUser.updateMany({
        where: {
          organizationId: id,
          deletedAt: null,
        },
        data: {
          deletedAt,
          status: 'removed',
        },
      });

      return tx.organization.update({
        where: { id },
        data: { deletedAt },
      });
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
