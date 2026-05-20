import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

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
    return this.organizationsService.findOne(BigInt(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrganizationDto: UpdateOrganizationDto) {
    return this.organizationsService.update(BigInt(id), updateOrganizationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(BigInt(id));
  }

  @Post(':id/users')
  addUserToOrganization(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ) {
    return this.organizationsService.attachUser(BigInt(id), BigInt(userId));
  }

  @Delete(':id/users/:userId')
  removeUserFromOrganization(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.organizationsService.detachUser(BigInt(id), BigInt(userId));
  }
}
