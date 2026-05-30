import type { ApiId } from '../common';
import type { OrganizationResponse, GovernanceRole } from '../workspace';
import type { RoleResponse } from '../access';

export interface CreateTokenRequest {
  email: string;
  password: string;
}

export interface RegisterUserRequest extends CreateTokenRequest {
  name?: string;
  avatarUrl?: string;
}

export interface UserSummaryResponse {
  id: ApiId;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface AuthTokenResponse {
  access_token: string;
}

export interface AuthResponse extends AuthTokenResponse {
  user: UserSummaryResponse;
}

export interface CurrentActorResponse {
  userId: ApiId;
  email: string;
}

export interface SessionMembershipResponse {
  id: ApiId;
  governanceRole: GovernanceRole;
  organization: OrganizationResponse;
}

export interface SessionResponse {
  user: UserSummaryResponse;
  memberships: SessionMembershipResponse[];
}

export interface CreateUserRequest {
  email: string;
  name?: string;
  avatarUrl?: string;
}

export type UpdateUserRequest = Partial<CreateUserRequest>;

export interface UserResponse {
  id: ApiId;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  organization: OrganizationResponse | null;
  roles: RoleResponse[];
}
