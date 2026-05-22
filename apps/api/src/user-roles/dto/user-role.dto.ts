import { Expose } from 'class-transformer';

export class UserRoleResponse {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  description!: string | null;
}
