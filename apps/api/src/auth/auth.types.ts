export type AccessTokenPayload = {
  sub: string;
  email: string;
};

export type AuthUser = {
  userId: bigint;
  email: string;
};

export type AuthenticatedActor = AuthUser & {
  organizationId: bigint;
  governanceRole: 'owner' | 'member';
};
