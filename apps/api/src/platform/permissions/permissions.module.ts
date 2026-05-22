import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { PlatformOrganizationContextGuard } from '../platform-organization-context.guard';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PermissionsController],
  providers: [PermissionsService, PlatformOrganizationContextGuard],
  exports: [PermissionsService],
})
export class PermissionsModule {}
