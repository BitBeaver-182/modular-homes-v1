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
import { platformPath } from '../platform.constants';
import { PlatformOrganizationContextGuard } from '../platform-organization-context.guard';
import {
  ApiBigIntIdParam,
  ApiOrganizationHeader,
} from '../platform-swagger.decorator';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { PermissionResponse } from './dto/permission-response.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionsService } from './permissions.service';

@ApiTags('Permissions')
@ApiOrganizationHeader()
@UseGuards(PlatformOrganizationContextGuard)
@Controller(platformPath('permissions'))
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create Permission',
    description: 'Create a permission.',
  })
  @ApiCreatedResponse({ type: PermissionResponse })
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    const permission =
      await this.permissionsService.create(createPermissionDto);
    return plainToInstance(PermissionResponse, permission, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'List Permission',
    description: 'Return all permissions.',
  })
  @ApiOkResponse({ type: PermissionResponse, isArray: true })
  async findAll() {
    const permissions = await this.permissionsService.findAll();
    return plainToInstance(PermissionResponse, permissions, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Permission',
    description: 'Return a single permission by id.',
  })
  @ApiBigIntIdParam('id', 'permission')
  @ApiOkResponse({ type: PermissionResponse })
  async findOne(@Param('id') id: string) {
    const permission = await this.permissionsService.findOne(
      parseBigIntId(id, 'permissionId'),
    );
    return plainToInstance(PermissionResponse, permission, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update Permission',
    description: 'Update a single permission by id.',
  })
  @ApiBigIntIdParam('id', 'permission')
  @ApiOkResponse({ type: PermissionResponse })
  async update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    const permission = await this.permissionsService.update(
      parseBigIntId(id, 'permissionId'),
      updatePermissionDto,
    );
    return plainToInstance(PermissionResponse, permission, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete Permission',
    description: 'Delete a single permission by id.',
  })
  @ApiBigIntIdParam('id', 'permission')
  @ApiOkResponse({ type: PermissionResponse })
  async remove(@Param('id') id: string) {
    const permission = await this.permissionsService.remove(
      parseBigIntId(id, 'permissionId'),
    );
    return plainToInstance(PermissionResponse, permission, {
      excludeExtraneousValues: true,
    });
  }
}
