import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
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
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleResponse } from './dto/role-response.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { toRoleResponse } from './mappers/role.mapper';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@ApiOrganizationHeader()
@UseGuards(PlatformOrganizationContextGuard)
@Controller(platformPath('roles'))
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create Role',
    description: 'Create a role in the active organization.',
  })
  @ApiCreatedResponse({ type: RoleResponse })
  async create(
    @OrganizationId() organizationId: bigint,
    @Body() createRoleDto: CreateRoleDto,
  ) {
    const role = await this.rolesService.create(organizationId, createRoleDto);
    return plainToInstance(RoleResponse, toRoleResponse(role), {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'List Role',
    description: 'Return all roles in the active organization.',
  })
  @ApiOkResponse({ type: RoleResponse, isArray: true })
  async findAll(@OrganizationId() organizationId: bigint) {
    const roles = await this.rolesService.findAll(organizationId);
    return plainToInstance(
      RoleResponse,
      roles.map((role) => toRoleResponse(role)),
      {
        excludeExtraneousValues: true,
      },
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Role',
    description: 'Return a single role by id in the active organization.',
  })
  @ApiBigIntIdParam('id', 'role')
  @ApiOkResponse({ type: RoleResponse })
  async findOne(
    @OrganizationId() organizationId: bigint,
    @Param('id') id: string,
  ) {
    const role = await this.rolesService.findOne(
      organizationId,
      parseBigIntId(id, 'roleId'),
    );
    return plainToInstance(RoleResponse, toRoleResponse(role), {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update Role',
    description: 'Update a single role by id in the active organization.',
  })
  @ApiBigIntIdParam('id', 'role')
  @ApiOkResponse({ type: RoleResponse })
  async update(
    @OrganizationId() organizationId: bigint,
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    const role = await this.rolesService.update(
      organizationId,
      parseBigIntId(id, 'roleId'),
      updateRoleDto,
    );
    return plainToInstance(RoleResponse, toRoleResponse(role), {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete Role',
    description: 'Delete a single role by id from the active organization.',
  })
  @ApiBigIntIdParam('id', 'role')
  @ApiOkResponse({ type: RoleResponse })
  async remove(
    @OrganizationId() organizationId: bigint,
    @Param('id') id: string,
  ) {
    const role = await this.rolesService.remove(
      organizationId,
      parseBigIntId(id, 'roleId'),
    );
    return plainToInstance(RoleResponse, toRoleResponse(role), {
      excludeExtraneousValues: true,
    });
  }
}
