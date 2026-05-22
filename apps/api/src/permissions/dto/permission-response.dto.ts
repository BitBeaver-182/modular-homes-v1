import { Expose } from 'class-transformer';

export interface PermissionDto {
  id: string;
  key: string;
  description: string | null;
}

export class PermissionResponse implements PermissionDto {
  constructor(partial: Partial<PermissionDto>) {
    Object.assign(this, partial);
  }

  @Expose()
  id!: string;

  @Expose()
  key!: string;

  @Expose()
  description!: string | null;
}
