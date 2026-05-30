import type { ApiId } from '../common';

export interface CreateRoleRequest {
  name: string;
  description?: string;
}

export type UpdateRoleRequest = Partial<CreateRoleRequest>;

export interface RoleResponse {
  id: ApiId;
  name: string;
  description: string | null;
}

export interface CreatePermissionRequest {
  key: string;
  description?: string;
}

export type UpdatePermissionRequest = Partial<CreatePermissionRequest>;

export interface PermissionResponse {
  id: ApiId;
  key: string;
  description: string | null;
}

export interface AssignUserRoleRequest {
  roleId: ApiId;
}

export type UserRoleResponse = RoleResponse;

export interface AssignRolePermissionRequest {
  permissionId: ApiId;
}

export type RolePermissionResponse = PermissionResponse;
