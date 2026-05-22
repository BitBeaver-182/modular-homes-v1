import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { PlatformOrganizationContextGuard } from '../platform-organization-context.guard';

@Module({
  imports: [DatabaseModule],
  controllers: [RolesController],
  providers: [RolesService, PlatformOrganizationContextGuard],
  exports: [RolesService],
})
export class RolesModule {}
