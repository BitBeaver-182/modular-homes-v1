import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { parseBigIntId } from '../common/ids/parse-bigint-id';
import type { PlatformRequest } from './platform-request';

@Injectable()
export class PlatformOrganizationContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PlatformRequest>();
    const headerValue = request.headers['x-organization-id'];
    const rawOrganizationId = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue;

    if (rawOrganizationId == null || rawOrganizationId === '') {
      throw new BadRequestException('x-organization-id header is required');
    }

    const organizationId = parseBigIntId(
      rawOrganizationId,
      'x-organization-id',
    );

    const organization = await this.prisma.organization.findFirst({
      where: {
        id: organizationId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    request.organizationId = organizationId;
    return true;
  }
}
