import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { parseBigIntId } from '../common/ids/parse-bigint-id';
import { OrganizationId } from '../platform/organization-id.decorator';
import { platformPath } from '../platform/platform.constants';
import { PlatformOrganizationContextGuard } from '../platform/platform-organization-context.guard';
import { UserRoleResponse } from './dto/user-role.dto';
import { UserRolesService } from './user-roles.service';

@UseGuards(PlatformOrganizationContextGuard)
@Controller(platformPath('users/:userId/roles'))
export class UserRolesController {
  constructor(private readonly userRolesService: UserRolesService) {}

  @Post()
  async assignRole(
    @OrganizationId() organizationId: bigint,
    @Param('userId') userId: string,
    @Body('roleId') roleId: string,
  ) {
    const role = await this.userRolesService.assignRole(
      organizationId,
      parseBigIntId(userId, 'userId'),
      parseBigIntId(roleId, 'roleId'),
    );
    return plainToInstance(UserRoleResponse, role, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  async findAll(
    @OrganizationId() organizationId: bigint,
    @Param('userId') userId: string,
  ) {
    const roles = await this.userRolesService.findAll(
      organizationId,
      parseBigIntId(userId, 'userId'),
    );
    return plainToInstance(UserRoleResponse, roles, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':roleId')
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
    return plainToInstance(UserRoleResponse, role, {
      excludeExtraneousValues: true,
    });
  }
}
