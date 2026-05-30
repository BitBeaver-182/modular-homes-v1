import {
  Body,
  Controller,
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
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { parseBigIntId } from '../../common/ids/parse-bigint-id';
import { JwtGuard } from '../../auth/guard/jwt.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { OrganizationId } from '../organization-id.decorator';
import { PlatformOwnerGuard } from '../platform-owner.guard';
import { platformPath } from '../platform.constants';
import { PlatformOrganizationContextGuard } from '../platform-organization-context.guard';
import {
  ApiBigIntIdParam,
  ApiOrganizationHeader,
} from '../platform-swagger.decorator';
import { OrganizationMembershipResponse } from './dto/organization-membership-response.dto';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';
import { toOrganizationMembershipResponse } from './mappers/organization-membership.mapper';
import { OrganizationUsersService } from './organization-users.service';

@ApiTags('Organization Memberships')
@ApiBearerAuth()
@ApiOrganizationHeader()
@UseGuards(JwtGuard, PlatformOrganizationContextGuard, PlatformOwnerGuard)
@Controller(platformPath('organization-memberships'))
export class OrganizationUsersController {
  constructor(
    private readonly organizationUsersService: OrganizationUsersService,
  ) {}

  @Post('invitations')
  @ApiOperation({
    summary: 'Invite Member',
    description: 'Create an invited membership in the active organization.',
  })
  @ApiCreatedResponse({ type: OrganizationMembershipResponse })
  async invite(
    @OrganizationId() organizationId: bigint,
    @Body() createUserDto: CreateUserDto,
  ) {
    const membership =
      await this.organizationUsersService.inviteUserToOrganization(
        organizationId,
        createUserDto,
      );

    return plainToInstance(
      OrganizationMembershipResponse,
      toOrganizationMembershipResponse(membership),
      {
        excludeExtraneousValues: true,
      },
    );
  }

  @Post(':userId/activations')
  @ApiOperation({
    summary: 'Activate Membership',
    description: 'Activate an invited membership in the active organization.',
  })
  @ApiBigIntIdParam('userId', 'user')
  @ApiCreatedResponse({ type: OrganizationMembershipResponse })
  async activate(
    @OrganizationId() organizationId: bigint,
    @Param('userId') userId: string,
  ) {
    const membership = await this.organizationUsersService.activateMembership(
      organizationId,
      parseBigIntId(userId, 'userId'),
    );

    return plainToInstance(
      OrganizationMembershipResponse,
      toOrganizationMembershipResponse(membership),
      {
        excludeExtraneousValues: true,
      },
    );
  }

  @Post(':userId/owners')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Grant Owner',
    description:
      'Grant ownership to an active membership in the active organization.',
  })
  @ApiBigIntIdParam('userId', 'user')
  @ApiNoContentResponse()
  async grantOwner(
    @OrganizationId() organizationId: bigint,
    @Param('userId') userId: string,
  ) {
    await this.organizationUsersService.grantOwner(
      organizationId,
      parseBigIntId(userId, 'userId'),
    );
  }

  @Post(':userId/ownership-transfers')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Transfer Ownership',
    description:
      'Transfer sole ownership from one active owner to another active membership in the active organization.',
  })
  @ApiBigIntIdParam('userId', 'user')
  @ApiNoContentResponse()
  async transferOwnership(
    @OrganizationId() organizationId: bigint,
    @Param('userId') userId: string,
    @Body() transferOwnershipDto: TransferOwnershipDto,
  ) {
    await this.organizationUsersService.transferOwnership(
      organizationId,
      parseBigIntId(transferOwnershipDto.fromUserId, 'fromUserId'),
      parseBigIntId(userId, 'userId'),
    );
  }
}
