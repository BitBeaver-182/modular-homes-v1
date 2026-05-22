import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { PlatformOrganizationContextGuard } from '../platform-organization-context.guard';
import { UserRolesController } from './user-roles.controller';
import { UserRolesService } from './user-roles.service';

@Module({
  imports: [DatabaseModule],
  controllers: [UserRolesController],
  providers: [UserRolesService, PlatformOrganizationContextGuard],
  exports: [UserRolesService],
})
export class UserRolesModule {}
