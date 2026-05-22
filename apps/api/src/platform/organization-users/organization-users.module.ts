import { Module } from '@nestjs/common';
import { OrganizationUsersService } from './organization-users.service';

@Module({
  providers: [OrganizationUsersService],
  exports: [OrganizationUsersService],
})
export class OrganizationUsersModule {}
