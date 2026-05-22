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
import { plainToInstance } from 'class-transformer';
import { parseBigIntId } from '../common/ids/parse-bigint-id';
import { OrganizationId } from '../platform/organization-id.decorator';
import { platformPath } from '../platform/platform.constants';
import { PlatformOrganizationContextGuard } from '../platform/platform-organization-context.guard';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleResponse } from './dto/role-response.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@UseGuards(PlatformOrganizationContextGuard)
@Controller(platformPath('roles'))
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  async create(
    @OrganizationId() organizationId: bigint,
    @Body() createRoleDto: CreateRoleDto,
  ) {
    const role = await this.rolesService.create(organizationId, createRoleDto);
    return plainToInstance(RoleResponse, role, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  async findAll(@OrganizationId() organizationId: bigint) {
    const roles = await this.rolesService.findAll(organizationId);
    return plainToInstance(RoleResponse, roles, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id')
  async findOne(
    @OrganizationId() organizationId: bigint,
    @Param('id') id: string,
  ) {
    const role = await this.rolesService.findOne(
      organizationId,
      parseBigIntId(id),
    );
    return plainToInstance(RoleResponse, role, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  async update(
    @OrganizationId() organizationId: bigint,
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    const role = await this.rolesService.update(
      organizationId,
      parseBigIntId(id),
      updateRoleDto,
    );
    return plainToInstance(RoleResponse, role, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  async remove(
    @OrganizationId() organizationId: bigint,
    @Param('id') id: string,
  ) {
    const role = await this.rolesService.remove(
      organizationId,
      parseBigIntId(id),
    );
    return plainToInstance(RoleResponse, role, {
      excludeExtraneousValues: true,
    });
  }
}
