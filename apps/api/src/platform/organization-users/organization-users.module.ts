import { Module } from '@nestjs/common';
import { PlatformOwnerGuard } from '../platform-owner.guard';
import { OrganizationUsersController } from './organization-users.controller';
import { OrganizationUsersService } from './organization-users.service';

@Module({
  controllers: [OrganizationUsersController],
  providers: [OrganizationUsersService, PlatformOwnerGuard],
  exports: [OrganizationUsersService],
})
export class OrganizationUsersModule {}
