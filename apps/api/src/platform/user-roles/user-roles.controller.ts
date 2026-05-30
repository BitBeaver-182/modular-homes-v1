import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { parseBigIntId } from '../../common/ids/parse-bigint-id';
import { OrganizationId } from '../organization-id.decorator';
import { platformPath } from '../platform.constants';
import { PlatformOrganizationContextGuard } from '../platform-organization-context.guard';
import {
  ApiBigIntIdParam,
  ApiOrganizationHeader,
} from '../platform-swagger.decorator';
import { AssignUserRoleDto } from './dto/assign-user-role.dto';
import { UserRoleResponse } from './dto/user-role.dto';
import { toRoleResponse } from '../roles/mappers/role.mapper';
import { UserRolesService } from './user-roles.service';

@ApiTags('Users/Roles')
@ApiOrganizationHeader()
@UseGuards(PlatformOrganizationContextGuard)
@Controller(platformPath('users/:userId/roles'))
export class UserRolesController {
  constructor(private readonly userRolesService: UserRolesService) {}

  @Post()
  @ApiOperation({
    summary: 'Assign User Role',
    description: 'Assign a role to a user in the active organization.',
  })
  @ApiBigIntIdParam('userId', 'user')
  @ApiBody({ type: AssignUserRoleDto })
  @ApiCreatedResponse({ type: UserRoleResponse })
  async assignRole(
    @OrganizationId() organizationId: bigint,
    @Param('userId') userId: string,
    @Body() assignUserRoleDto: AssignUserRoleDto,
  ) {
    const role = await this.userRolesService.assignRole(
      organizationId,
      parseBigIntId(userId, 'userId'),
      parseBigIntId(assignUserRoleDto.roleId, 'roleId'),
    );
    return plainToInstance(UserRoleResponse, toRoleResponse(role), {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'List User Role',
    description:
      'Return all roles assigned to a user in the active organization.',
  })
  @ApiBigIntIdParam('userId', 'user')
  @ApiOkResponse({ type: UserRoleResponse, isArray: true })
  async findAll(
    @OrganizationId() organizationId: bigint,
    @Param('userId') userId: string,
  ) {
    const roles = await this.userRolesService.findAll(
      organizationId,
      parseBigIntId(userId, 'userId'),
    );
    return plainToInstance(
      UserRoleResponse,
      roles.map((role) => toRoleResponse(role)),
      {
        excludeExtraneousValues: true,
      },
    );
  }

  @Delete(':roleId')
  @ApiOperation({
    summary: 'Remove User Role',
    description: 'Remove a role from a user in the active organization.',
  })
  @ApiBigIntIdParam('userId', 'user')
  @ApiBigIntIdParam('roleId', 'role')
  @ApiOkResponse({ type: UserRoleResponse })
  async removeRole(
    @OrganizationId() organizationId: bigint,
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    const role = await this.userRolesService.removeRole(
      organizationId,
      parseBigIntId(userId, 'userId'),
      parseBigIntId(roleId, 'roleId'),
    );
    return plainToInstance(UserRoleResponse, toRoleResponse(role), {
      excludeExtraneousValues: true,
    });
  }
}
