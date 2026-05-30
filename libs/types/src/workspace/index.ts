import type { ApiId, IsoDateString } from '../common';

export const GOVERNANCE_ROLES = ['owner', 'member'] as const;
export type GovernanceRole = (typeof GOVERNANCE_ROLES)[number];

export const MEMBERSHIP_STATUSES = ['invited', 'active', 'removed'] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const INVITATION_STATUSES = [
  'pending',
  'accepted',
  'expired',
  'revoked',
  'rejected',
] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
}

export type UpdateOrganizationRequest = Partial<CreateOrganizationRequest>;

export interface OrganizationResponse {
  id: ApiId;
  name: string;
  slug: string;
}

export interface OrganizationMembershipUserResponse {
  id: ApiId;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface OrganizationMembershipResponse {
  id: ApiId;
  organizationId: ApiId;
  governanceRole: GovernanceRole;
  status: MembershipStatus;
  user: OrganizationMembershipUserResponse;
}

export interface CreateOrganizationInvitationRequest {
  email: string;
  governanceRole: GovernanceRole;
}

export interface OrganizationInvitationOrganizationResponse {
  id: ApiId;
  name: string;
  slug: string;
}

export interface OrganizationInvitationResponse {
  id: ApiId;
  organizationId: ApiId;
  email: string;
  governanceRole: GovernanceRole;
  status: InvitationStatus;
  organization?: OrganizationInvitationOrganizationResponse;
  expiresAt?: IsoDateString | null;
  acceptedAt?: IsoDateString | null;
  revokedAt?: IsoDateString | null;
  rejectedAt?: IsoDateString | null;
  createdAt?: IsoDateString;
  updatedAt?: IsoDateString;
}

export interface TransferOwnershipRequest {
  fromUserId: ApiId;
}
