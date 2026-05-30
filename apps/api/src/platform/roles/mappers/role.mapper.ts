import type { RoleResponse } from '@moduflow/types';
import { toApiId } from '../../../common/mappers/transport';

type RoleRecord = {
  id: bigint;
  name: string;
  description: string | null;
};

export function toRoleResponse(role: RoleRecord): RoleResponse {
  return {
    id: toApiId(role.id),
    name: role.name,
    description: role.description,
  };
}
