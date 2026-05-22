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
import { parseBigIntId } from '../common/ids/parse-bigint-id';
import { OrganizationId } from '../platform/organization-id.decorator';
import { platformPath } from '../platform/platform.constants';
import { PlatformOrganizationContextGuard } from '../platform/platform-organization-context.guard';
import {
  ApiBigIntIdParam,
  ApiOrganizationHeader,
} from '../platform/platform-swagger.decorator';
import { AssignRolePermissionDto } from './dto/assign-role-permission.dto';
import { RolePermissionResponse } from './dto/role-permission.dto';
import { RolePermissionsService } from './role-permissions.service';

@ApiTags('Roles/Permissions')
@ApiOrganizationHeader()
@UseGuards(PlatformOrganizationContextGuard)
@Controller(platformPath('roles/:roleId/permissions'))
export class RolePermissionsController {
  constructor(
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Assign Role Permission',
    description: 'Assign a permission to a role in the active organization.',
  })
  @ApiBigIntIdParam('roleId', 'role')
  @ApiBody({ type: AssignRolePermissionDto })
  @ApiCreatedResponse({ type: RolePermissionResponse })
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
  @ApiOperation({
    summary: 'List Role Permission',
    description:
      'Return all permissions assigned to a role in the active organization.',
  })
  @ApiBigIntIdParam('roleId', 'role')
  @ApiOkResponse({ type: RolePermissionResponse, isArray: true })
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
  @ApiOperation({
    summary: 'Remove Role Permission',
    description: 'Remove a permission from a role in the active organization.',
  })
  @ApiBigIntIdParam('roleId', 'role')
  @ApiBigIntIdParam('permissionId', 'permission')
  @ApiOkResponse({ type: RolePermissionResponse })
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
