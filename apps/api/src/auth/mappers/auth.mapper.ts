import type {
  AuthResponse,
  CurrentActorResponse,
  SessionResponse,
  UserSummaryResponse,
} from '@moduflow/types';
import { toApiId } from '../../common/mappers/transport';
import type { AuthUser } from '../auth.types';

type AuthenticatedUser = {
  id: bigint;
  email: string;
  name: string | null;
  avatarUrl: string | null;
};

type SessionUserRecord = {
  id: bigint;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  organizationUsers: Array<{
    id: bigint;
    governanceRole: SessionResponse['memberships'][number]['governanceRole'];
    organization: {
      id: bigint;
      name: string;
      slug: string;
      deletedAt: Date | null;
    };
  }>;
};

export function toUserSummaryResponse(
  user: AuthenticatedUser,
): UserSummaryResponse {
  return {
    id: toApiId(user.id),
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
  };
}

export function toAuthResponse(
  user: AuthenticatedUser,
  accessToken: string,
): AuthResponse {
  return {
    access_token: accessToken,
    user: toUserSummaryResponse(user),
  };
}

export function toCurrentActorResponse(user: AuthUser): CurrentActorResponse {
  return {
    userId: toApiId(user.userId),
    email: user.email,
  };
}

export function toSessionResponse(sessionUser: SessionUserRecord): SessionResponse {
  return {
    user: toUserSummaryResponse(sessionUser),
    memberships: sessionUser.organizationUsers
      .filter((membership) => membership.organization.deletedAt == null)
      .map((membership) => ({
        id: toApiId(membership.id),
        governanceRole: membership.governanceRole,
        organization: {
          id: toApiId(membership.organization.id),
          name: membership.organization.name,
          slug: membership.organization.slug,
        },
      })),
  };
}
