import type { OrganizationInvitationResponse } from '@moduflow/types';
import {
  toApiId,
  toOptionalIsoDateString,
  toIsoDateString,
} from '../../../common/mappers/transport';
import { toOrganizationResponse } from '../../../global/organizations/mappers/organization.mapper';

type OrganizationInvitationRecord = {
  id: bigint;
  organizationId: bigint;
  email: string;
  governanceRole: OrganizationInvitationResponse['governanceRole'];
  status: OrganizationInvitationResponse['status'];
  expiresAt?: Date | null;
  acceptedAt?: Date | null;
  revokedAt?: Date | null;
  rejectedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  organization?: {
    id: bigint;
    name: string;
    slug: string;
  };
};

export function toOrganizationInvitationResponse(
  invitation: OrganizationInvitationRecord,
): OrganizationInvitationResponse {
  return {
    id: toApiId(invitation.id),
    organizationId: toApiId(invitation.organizationId),
    email: invitation.email,
    governanceRole: invitation.governanceRole,
    status: invitation.status,
    organization: invitation.organization
      ? toOrganizationResponse(invitation.organization)
      : undefined,
    expiresAt: toOptionalIsoDateString(invitation.expiresAt),
    acceptedAt: toOptionalIsoDateString(invitation.acceptedAt),
    revokedAt: toOptionalIsoDateString(invitation.revokedAt),
    rejectedAt: toOptionalIsoDateString(invitation.rejectedAt),
    createdAt: invitation.createdAt
      ? toIsoDateString(invitation.createdAt)
      : undefined,
    updatedAt: invitation.updatedAt
      ? toIsoDateString(invitation.updatedAt)
      : undefined,
  };
}
