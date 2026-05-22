import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PlatformRequest } from './platform-request';

export const OrganizationId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): bigint => {
    const request = ctx.switchToHttp().getRequest<PlatformRequest>();
    return request.organizationId;
  },
);
