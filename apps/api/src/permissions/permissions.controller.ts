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
import { platformPath } from '../platform/platform.constants';
import { PlatformOrganizationContextGuard } from '../platform/platform-organization-context.guard';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { PermissionResponse } from './dto/permission-response.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionsService } from './permissions.service';

@UseGuards(PlatformOrganizationContextGuard)
@Controller(platformPath('permissions'))
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    const permission =
      await this.permissionsService.create(createPermissionDto);
    return plainToInstance(PermissionResponse, permission, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  async findAll() {
    const permissions = await this.permissionsService.findAll();
    return plainToInstance(PermissionResponse, permissions, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const permission = await this.permissionsService.findOne(parseBigIntId(id));
    return plainToInstance(PermissionResponse, permission, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    const permission = await this.permissionsService.update(
      parseBigIntId(id),
      updatePermissionDto,
    );
    return plainToInstance(PermissionResponse, permission, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const permission = await this.permissionsService.remove(parseBigIntId(id));
    return plainToInstance(PermissionResponse, permission, {
      excludeExtraneousValues: true,
    });
  }
}
