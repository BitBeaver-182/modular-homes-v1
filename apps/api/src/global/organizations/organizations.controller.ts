import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { JwtGuard } from '../../auth/guard/jwt.guard';
import type { AuthUser } from '../../auth/auth.types';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { parseBigIntId } from '../../common/ids/parse-bigint-id';
import { OrganizationResponse } from './dto/organization-response.dto';
import { ApiBigIntIdParam } from '../../platform/platform-swagger.decorator';

@ApiTags('Organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create Organization',
    description: 'Create a new organization for the authenticated user.',
  })
  @ApiCreatedResponse({ type: OrganizationResponse })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() createOrganizationDto: CreateOrganizationDto,
  ) {
    const organization = await this.organizationsService.createForUser(
      user.userId,
      createOrganizationDto,
    );
    return plainToInstance(OrganizationResponse, organization, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'List Organization',
    description: 'Return all organizations.',
  })
  @ApiOkResponse({ type: OrganizationResponse, isArray: true })
  async findAll() {
    const organizations = await this.organizationsService.findAll();
    return plainToInstance(OrganizationResponse, organizations, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Organization',
    description: 'Return a single organization by id.',
  })
  @ApiBigIntIdParam('id', 'organization')
  @ApiOkResponse({ type: OrganizationResponse })
  async findOne(@Param('id') id: string) {
    const organization = await this.organizationsService.findOne(
      parseBigIntId(id, 'organizationId'),
    );
    return plainToInstance(OrganizationResponse, organization, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update Organization',
    description: 'Update a single organization by id.',
  })
  @ApiBigIntIdParam('id', 'organization')
  @ApiOkResponse({ type: OrganizationResponse })
  async update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    const organization = await this.organizationsService.update(
      parseBigIntId(id, 'organizationId'),
      updateOrganizationDto,
    );
    return plainToInstance(OrganizationResponse, organization, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete Organization',
    description: 'Delete a single organization by id.',
  })
  @ApiBigIntIdParam('id', 'organization')
  @ApiOkResponse({ type: OrganizationResponse })
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const organization = await this.organizationsService.removeForUser(
      user.userId,
      parseBigIntId(id, 'organizationId'),
    );
    return plainToInstance(OrganizationResponse, organization, {
      excludeExtraneousValues: true,
    });
  }
}
