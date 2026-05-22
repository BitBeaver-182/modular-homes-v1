import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { OrganizationInvitationsModule } from './organization-invitations/organization-invitations.module';
import { UserRolesModule } from './user-roles/user-roles.module';
import { RolePermissionsModule } from './role-permissions/role-permissions.module';
import { OrganizationUsersModule } from './organization-users/organization-users.module';

@Module({
  imports: [
    UsersModule,
    RolesModule,
    PermissionsModule,
    OrganizationInvitationsModule,
    UserRolesModule,
    RolePermissionsModule,
    OrganizationUsersModule,
  ],
})
export class PlatformModule {}
