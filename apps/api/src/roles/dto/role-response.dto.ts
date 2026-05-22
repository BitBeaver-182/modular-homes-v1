import { Expose } from 'class-transformer';

export interface RoleDto {
  id: string;
  name: string;
  description: string | null;
}

export class RoleResponse implements RoleDto {
  constructor(partial: Partial<RoleDto>) {
    Object.assign(this, partial);
  }

  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  description!: string | null;
}
