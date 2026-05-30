import type { Request } from 'express';
import type { AuthenticatedActor, AuthUser } from '../auth/auth.types';

export type PlatformRequest = Request & {
  actor?: AuthenticatedActor;
  organizationId: bigint;
  user: AuthUser;
};
