import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { parseBigIntId } from '../common/ids/parse-bigint-id';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Get()
  findAll() {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(parseBigIntId(id));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(
      parseBigIntId(id),
      updateOrganizationDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(parseBigIntId(id));
  }

  @Post(':id/users')
  addUserToOrganization(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ) {
    return this.organizationsService.attachUser(
      parseBigIntId(id),
      parseBigIntId(userId, 'userId'),
    );
  }

  @Delete(':id/users/:userId')
  removeUserFromOrganization(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.organizationsService.detachUser(
      parseBigIntId(id),
      parseBigIntId(userId, 'userId'),
    );
  }
}
