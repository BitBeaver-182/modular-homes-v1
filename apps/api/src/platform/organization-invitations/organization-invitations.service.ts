import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { AuthUser } from '../../auth/auth.types';
import { CreateOrganizationInvitationDto } from './dto/create-organization-invitation.dto';

@Injectable()
export class OrganizationInvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPendingInvitationsForEmail(email: string) {
    return this.prisma.organizationInvitation.findMany({
      where: {
        email,
        status: 'pending',
        deletedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [{ id: 'desc' }],
    });
  }

  async createInvitation(
    organizationId: bigint,
    createInvitationDto: CreateOrganizationInvitationDto,
  ) {
    const existingInvitation =
      await this.prisma.organizationInvitation.findFirst({
        where: {
          organizationId,
          email: createInvitationDto.email,
          status: 'pending',
          deletedAt: null,
        },
        select: { id: true },
      });

    if (existingInvitation) {
      throw new BadRequestException('Invitation already exists');
    }

    return this.prisma.organizationInvitation.create({
      data: {
        organizationId,
        email: createInvitationDto.email,
        governanceRole: createInvitationDto.governanceRole,
        status: 'pending',
      },
    });
  }

  async acceptInvitation(invitationId: bigint, user: AuthUser): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const invitation = await tx.organizationInvitation.findUnique({
        where: { id: invitationId },
      });

      if (
        !invitation ||
        invitation.deletedAt ||
        invitation.status !== 'pending' ||
        (invitation.expiresAt != null && invitation.expiresAt <= new Date())
      ) {
        throw new NotFoundException('Invitation not found');
      }

      if (invitation.email !== user.email) {
        throw new ForbiddenException('Invitation email does not match actor');
      }

      const existingMembership = await tx.organizationUser.findUnique({
        where: {
          userId_organizationId: {
            userId: user.userId,
            organizationId: invitation.organizationId,
          },
        },
      });

      if (existingMembership && existingMembership.deletedAt == null) {
        throw new BadRequestException('User already belongs to organization');
      }

      if (existingMembership) {
        await tx.organizationUser.update({
          where: { id: existingMembership.id },
          data: {
            deletedAt: null,
            governanceRole: invitation.governanceRole,
            status: 'active',
          },
        });
      } else {
        await tx.organizationUser.create({
          data: {
            organizationId: invitation.organizationId,
            userId: user.userId,
            governanceRole: invitation.governanceRole,
            status: 'active',
          },
        });
      }

      await tx.organizationInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'accepted',
          acceptedAt: new Date(),
          deletedAt: new Date(),
        },
      });
    });
  }

  async rejectInvitation(invitationId: bigint, user: AuthUser): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const invitation = await tx.organizationInvitation.findUnique({
        where: { id: invitationId },
      });

      if (
        !invitation ||
        invitation.deletedAt ||
        invitation.status !== 'pending' ||
        (invitation.expiresAt != null && invitation.expiresAt <= new Date())
      ) {
        throw new NotFoundException('Invitation not found');
      }

      if (invitation.email !== user.email) {
        throw new ForbiddenException('Invitation email does not match actor');
      }

      const rejectedAt = new Date();
      await tx.organizationInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'rejected',
          rejectedAt,
          deletedAt: rejectedAt,
        },
      });
    });
  }
}
