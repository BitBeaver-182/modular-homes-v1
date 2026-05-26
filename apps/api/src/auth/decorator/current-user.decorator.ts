import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PlatformRequest } from '../../platform/platform-request';
import type { AuthUser } from '../auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<PlatformRequest>();
    return request.user;
  },
);
