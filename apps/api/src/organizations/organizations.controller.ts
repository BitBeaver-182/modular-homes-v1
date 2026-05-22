import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { parseBigIntId } from '../common/ids/parse-bigint-id';
import { OrganizationResponse } from './dto/organization-response.dto';
import { ApiBigIntIdParam } from '../platform/platform-swagger.decorator';

@ApiTags('Organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an organization' })
  @ApiCreatedResponse({ type: OrganizationResponse })
  async create(@Body() createOrganizationDto: CreateOrganizationDto) {
    const organization = await this.organizationsService.create(
      createOrganizationDto,
    );
    return plainToInstance(OrganizationResponse, organization, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List organizations' })
  @ApiOkResponse({ type: OrganizationResponse, isArray: true })
  async findAll() {
    const organizations = await this.organizationsService.findAll();
    return plainToInstance(OrganizationResponse, organizations, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an organization by id' })
  @ApiBigIntIdParam('id', 'organization')
  @ApiOkResponse({ type: OrganizationResponse })
  async findOne(@Param('id') id: string) {
    const organization = await this.organizationsService.findOne(
      parseBigIntId(id),
    );
    return plainToInstance(OrganizationResponse, organization, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an organization' })
  @ApiBigIntIdParam('id', 'organization')
  @ApiOkResponse({ type: OrganizationResponse })
  async update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    const organization = await this.organizationsService.update(
      parseBigIntId(id),
      updateOrganizationDto,
    );
    return plainToInstance(OrganizationResponse, organization, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an organization' })
  @ApiBigIntIdParam('id', 'organization')
  @ApiOkResponse({ type: OrganizationResponse })
  async remove(@Param('id') id: string) {
    const organization = await this.organizationsService.remove(
      parseBigIntId(id),
    );
    return plainToInstance(OrganizationResponse, organization, {
      excludeExtraneousValues: true,
    });
  }
}
