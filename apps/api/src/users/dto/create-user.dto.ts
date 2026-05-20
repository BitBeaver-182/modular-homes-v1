export class CreateUserDto {
  email!: string;
  organizationId?: bigint;
  name?: string;
  avatarUrl?: string;
}
