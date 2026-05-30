import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { PlatformRequest } from './platform-request';

@Injectable()
export class PlatformMembershipGuard {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PlatformRequest>();

    const membership = await this.prisma.organizationUser.findFirst({
      where: {
        organizationId: request.organizationId,
        userId: request.user?.userId,
        deletedAt: null,
        status: 'active',
      },
      select: { governanceRole: true },
    });

    if (!membership) {
      throw new ForbiddenException('Organization membership required');
    }

    request.actor = {
      ...request.user,
      organizationId: request.organizationId,
      governanceRole: membership.governanceRole,
    };

    return true;
  }
}
