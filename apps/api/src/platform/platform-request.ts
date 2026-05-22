import type { Request } from 'express';

export type PlatformRequest = Request & {
  organizationId: bigint;
};
