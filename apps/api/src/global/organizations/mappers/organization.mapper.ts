import type { OrganizationResponse } from '@moduflow/types';
import { toApiId } from '../../../common/mappers/transport';

type OrganizationRecord = {
  id: bigint;
  name: string;
  slug: string;
};

export function toOrganizationResponse(
  organization: OrganizationRecord,
): OrganizationResponse {
  return {
    id: toApiId(organization.id),
    name: organization.name,
    slug: organization.slug,
  };
}
