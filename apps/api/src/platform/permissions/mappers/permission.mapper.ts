import type { PermissionResponse } from '@moduflow/types';
import { toApiId } from '../../../common/mappers/transport';

type PermissionRecord = {
  id: bigint;
  key: string;
  description: string | null;
};

export function toPermissionResponse(
  permission: PermissionRecord,
): PermissionResponse {
  return {
    id: toApiId(permission.id),
    key: permission.key,
    description: permission.description,
  };
}
