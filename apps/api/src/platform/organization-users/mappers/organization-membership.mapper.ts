import type { OrganizationMembershipResponse } from '@moduflow/types';
import { toApiId } from '../../../common/mappers/transport';

type OrganizationMembershipRecord = {
  id: bigint;
  organizationId: bigint;
  governanceRole: OrganizationMembershipResponse['governanceRole'];
  status: OrganizationMembershipResponse['status'];
  user: {
    id: bigint;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };
};

export function toOrganizationMembershipResponse(
  membership: OrganizationMembershipRecord,
): OrganizationMembershipResponse {
  return {
    id: toApiId(membership.id),
    organizationId: toApiId(membership.organizationId),
    governanceRole: membership.governanceRole,
    status: membership.status,
    user: {
      id: toApiId(membership.user.id),
      email: membership.user.email,
      name: membership.user.name,
      avatarUrl: membership.user.avatarUrl,
    },
  };
}
