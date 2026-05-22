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
import { RolePermissionResponse } from './dto/role-permission.dto';
import { RolePermissionsService } from './role-permissions.service';

@UseGuards(PlatformOrganizationContextGuard)
@Controller(platformPath('roles/:roleId/permissions'))
export class RolePermissionsController {
  constructor(
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  @Post()
  async assignPermission(
    @OrganizationId() organizationId: bigint,
    @Param('roleId') roleId: string,
    @Body('permissionId') permissionId: string,
  ) {
    const permission = await this.rolePermissionsService.assignPermission(
      organizationId,
      parseBigIntId(roleId, 'roleId'),
      parseBigIntId(permissionId, 'permissionId'),
    );
    return plainToInstance(RolePermissionResponse, permission, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  async findAll(
    @OrganizationId() organizationId: bigint,
    @Param('roleId') roleId: string,
  ) {
    const permissions = await this.rolePermissionsService.findAll(
      organizationId,
      parseBigIntId(roleId, 'roleId'),
    );
    return plainToInstance(RolePermissionResponse, permissions, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':permissionId')
  async removePermission(
    @OrganizationId() organizationId: bigint,
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    const permission = await this.rolePermissionsService.removePermission(
      organizationId,
      parseBigIntId(roleId, 'roleId'),
      parseBigIntId(permissionId, 'permissionId'),
    );
    return plainToInstance(RolePermissionResponse, permission, {
      excludeExtraneousValues: true,
    });
  }
}
