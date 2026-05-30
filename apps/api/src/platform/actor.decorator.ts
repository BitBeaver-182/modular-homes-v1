import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedActor } from '../auth/auth.types';
import type { PlatformRequest } from './platform-request';

export const Actor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedActor => {
    const request = ctx.switchToHttp().getRequest<PlatformRequest>();
    return request.actor as AuthenticatedActor;
  },
);
