import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { PlatformRequest } from './platform-request';

@Injectable()
export class PlatformOwnerGuard {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PlatformRequest>();
    const organizationId = request.organizationId;
    const userId = request.user?.userId;

    const membership = await this.prisma.organizationUser.findFirst({
      where: {
        organizationId,
        userId,
        deletedAt: null,
        status: 'active',
        governanceRole: 'owner',
      },
      select: { id: true },
    });

    if (!membership) {
      throw new ForbiddenException('Owner access required');
    }

    return true;
  }
}
