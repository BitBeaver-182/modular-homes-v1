import type { UserResponse } from '@moduflow/types';
import { toApiId } from '../../../common/mappers/transport';
import { toOrganizationResponse } from '../../../global/organizations/mappers/organization.mapper';
import { toRoleResponse } from '../../roles/mappers/role.mapper';

type UserWithOrganizationRoles = {
  id: bigint;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  organizationUsers?: Array<{
    organization?: {
      id: bigint;
      name: string;
      slug: string;
      deletedAt: Date | null;
    } | null;
    userRoles?: Array<{
      role: {
        id: bigint;
        name: string;
        description: string | null;
      };
    }>;
  }>;
};

function isActiveOrganization(
  organization:
    | {
        id: bigint;
        name: string;
        slug: string;
        deletedAt: Date | null;
      }
    | null
    | undefined,
): organization is {
  id: bigint;
  name: string;
  slug: string;
  deletedAt: Date | null;
} {
  return organization != null && organization.deletedAt == null;
}

export function toUserResponse(user: UserWithOrganizationRoles): UserResponse {
  const organizationUser = (user.organizationUsers ?? [])[0];

  return {
    id: toApiId(user.id),
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    organization: isActiveOrganization(organizationUser?.organization)
      ? toOrganizationResponse(organizationUser.organization)
      : null,
    roles: (organizationUser?.userRoles ?? []).map((userRole) =>
      toRoleResponse(userRole.role),
    ),
  };
}
