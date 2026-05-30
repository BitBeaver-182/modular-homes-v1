import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import type { AuthUser } from '../../auth/auth.types';
import { JwtGuard } from '../../auth/guard/jwt.guard';
import { parseBigIntId } from '../../common/ids/parse-bigint-id';
import { OrganizationId } from '../organization-id.decorator';
import { PlatformOwnerGuard } from '../platform-owner.guard';
import { platformPath } from '../platform.constants';
import { PlatformOrganizationContextGuard } from '../platform-organization-context.guard';
import {
  ApiBigIntIdParam,
  ApiOrganizationHeader,
} from '../platform-swagger.decorator';
import { CreateOrganizationInvitationDto } from './dto/create-organization-invitation.dto';
import { OrganizationInvitationResponse } from './dto/organization-invitation-response.dto';
import { toOrganizationInvitationResponse } from './mappers/organization-invitation.mapper';
import { OrganizationInvitationsService } from './organization-invitations.service';

@ApiTags('Organization Invitations')
@Controller(platformPath('organization-invitations'))
export class OrganizationInvitationsController {
  constructor(
    private readonly organizationInvitationsService: OrganizationInvitationsService,
  ) {}

  @Get('mine')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List my pending invitations',
    description:
      'Return pending invitations for the authenticated email across organizations.',
  })
  @ApiOkResponse({ type: OrganizationInvitationResponse, isArray: true })
  async findMine(@CurrentUser() user: AuthUser) {
    const invitations =
      await this.organizationInvitationsService.findPendingInvitationsForEmail(
        user.email,
      );

    return plainToInstance(
      OrganizationInvitationResponse,
      invitations.map((invitation) => toOrganizationInvitationResponse(invitation)),
      {
        excludeExtraneousValues: true,
      },
    );
  }

  @Post()
  @UseGuards(JwtGuard, PlatformOrganizationContextGuard, PlatformOwnerGuard)
  @ApiBearerAuth()
  @ApiOrganizationHeader()
  @ApiOperation({
    summary: 'Create invitation',
    description:
      'Create a pending invitation for an email in the active organization.',
  })
  @ApiCreatedResponse({ type: OrganizationInvitationResponse })
  async create(
    @OrganizationId() organizationId: bigint,
    @Body() createInvitationDto: CreateOrganizationInvitationDto,
  ) {
    const invitation =
      await this.organizationInvitationsService.createInvitation(
        organizationId,
        createInvitationDto,
      );

    return plainToInstance(
      OrganizationInvitationResponse,
      toOrganizationInvitationResponse(invitation),
      {
        excludeExtraneousValues: true,
      },
    );
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Accept invitation',
    description:
      'Accept a pending invitation for the authenticated user when the invitation email matches the actor email.',
  })
  @ApiBigIntIdParam('id', 'invitation')
  @ApiNoContentResponse()
  async accept(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.organizationInvitationsService.acceptInvitation(
      parseBigIntId(id, 'invitationId'),
      user,
    );
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reject invitation',
    description:
      'Reject a pending invitation for the authenticated user when the invitation email matches the actor email.',
  })
  @ApiBigIntIdParam('id', 'invitation')
  @ApiNoContentResponse()
  async reject(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.organizationInvitationsService.rejectInvitation(
      parseBigIntId(id, 'invitationId'),
      user,
    );
  }
}
