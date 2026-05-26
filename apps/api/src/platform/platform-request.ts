import type { Request } from 'express';
import type { AuthUser } from '../auth/auth.types';

export type PlatformRequest = Request & {
  organizationId: bigint;
  user: AuthUser;
};
