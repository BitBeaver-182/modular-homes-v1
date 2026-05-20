export class CreateUserDto {
  email!: string;
  organizationId?: bigint | number | string;
  name?: string;
  avatarUrl?: string;
}
