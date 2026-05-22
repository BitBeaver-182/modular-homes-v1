import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { OrganizationUsersModule } from '../organization-users/organization-users.module';
import { PlatformOrganizationContextGuard } from '../platform-organization-context.guard';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [DatabaseModule, OrganizationUsersModule],
  controllers: [UsersController],
  providers: [UsersService, PlatformOrganizationContextGuard],
  exports: [UsersService],
})
export class UsersModule {}
