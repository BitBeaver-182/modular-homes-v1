import { Module } from '@nestjs/common';
import { PlatformOwnerGuard } from '../platform-owner.guard';
import { OrganizationInvitationsController } from './organization-invitations.controller';
import { OrganizationInvitationsService } from './organization-invitations.service';

@Module({
  controllers: [OrganizationInvitationsController],
  providers: [OrganizationInvitationsService, PlatformOwnerGuard],
  exports: [OrganizationInvitationsService],
})
export class OrganizationInvitationsModule {}
