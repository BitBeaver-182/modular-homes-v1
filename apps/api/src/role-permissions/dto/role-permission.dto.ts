import { Expose } from 'class-transformer';

export class RolePermissionResponse {
  @Expose()
  id!: string;

  @Expose()
  key!: string;

  @Expose()
  description!: string | null;
}
