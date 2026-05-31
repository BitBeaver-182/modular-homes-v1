import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { OrganizationInvitationsModule } from './organization-invitations/organization-invitations.module';
import { UserRolesModule } from './user-roles/user-roles.module';
import { RolePermissionsModule } from './role-permissions/role-permissions.module';
import { OrganizationUsersModule } from './organization-users/organization-users.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { SupplierOrdersModule } from './supplier-orders/supplier-orders.module';
import { SupplierQuotesModule } from './supplier-quotes/supplier-quotes.module';

@Module({
  imports: [
    UsersModule,
    RolesModule,
    PermissionsModule,
    OrganizationInvitationsModule,
    UserRolesModule,
    RolePermissionsModule,
    OrganizationUsersModule,
    SuppliersModule,
    SupplierOrdersModule,
    SupplierQuotesModule,
  ],
})
export class PlatformModule {}
