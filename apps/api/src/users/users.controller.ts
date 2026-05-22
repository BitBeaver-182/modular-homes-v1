import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { parseBigIntId } from '../common/ids/parse-bigint-id';
import { UserResponse } from './dto/user-response.dto';
import { OrganizationId } from '../platform/organization-id.decorator';
import { platformPath } from '../platform/platform.constants';
import { PlatformOrganizationContextGuard } from '../platform/platform-organization-context.guard';
import {
  ApiBigIntIdParam,
  ApiOrganizationHeader,
} from '../platform/platform-swagger.decorator';

type UserWithOrganizationRoles = {
  organizationUsers?: Array<{
    organization?: {
      id: bigint;
      name: string;
      slug: string;
      deletedAt: Date | null;
    } | null;
    userRoles?: Array<{
      role: {
        id: bigint;
        name: string;
        description: string | null;
      };
    }>;
  }>;
} & Record<string, unknown>;

function isActiveOrganization(
  organization:
    | {
        id: bigint;
        name: string;
        slug: string;
        deletedAt: Date | null;
      }
    | null
    | undefined,
): organization is {
  id: bigint;
  name: string;
  slug: string;
  deletedAt: Date | null;
} {
  return organization != null && organization.deletedAt == null;
}

function toUserResponse(user: UserWithOrganizationRoles): UserResponse {
  const organizationUser = (user.organizationUsers ?? [])[0];
  return plainToInstance(
    UserResponse,
    {
      ...user,
      organization: isActiveOrganization(organizationUser?.organization)
        ? organizationUser.organization
        : null,
      roles: (organizationUser?.userRoles ?? []).map(
        (userRole) => userRole.role,
      ),
    },
    {
      excludeExtraneousValues: true,
    },
  );
}

@ApiTags('Users')
@ApiOrganizationHeader()
@UseGuards(PlatformOrganizationContextGuard)
@Controller(platformPath('users'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create User',
    description: 'Create a user in the active organization.',
  })
  @ApiCreatedResponse({ type: UserResponse })
  async create(
    @OrganizationId() organizationId: bigint,
    @Body() createUserDto: CreateUserDto,
  ) {
    const user = await this.usersService.create(organizationId, createUserDto);
    return toUserResponse(user);
  }

  @Get()
  @ApiOperation({
    summary: 'List User',
    description: 'Return all users in the active organization.',
  })
  @ApiOkResponse({ type: UserResponse, isArray: true })
  async findAll(@OrganizationId() organizationId: bigint) {
    const users = await this.usersService.findAll(organizationId);
    return users.map((user) => toUserResponse(user));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get User',
    description: 'Return a single user by id in the active organization.',
  })
  @ApiBigIntIdParam('id', 'user')
  @ApiOkResponse({ type: UserResponse })
  async findOne(
    @OrganizationId() organizationId: bigint,
    @Param('id') id: string,
  ) {
    const user = await this.usersService.findOne(
      organizationId,
      parseBigIntId(id),
    );
    return toUserResponse(user);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update User',
    description: 'Update a single user by id in the active organization.',
  })
  @ApiBigIntIdParam('id', 'user')
  @ApiOkResponse({ type: UserResponse })
  async update(
    @OrganizationId() organizationId: bigint,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(
      organizationId,
      parseBigIntId(id),
      updateUserDto,
    );
    return toUserResponse(user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete User',
    description: 'Delete a single user by id from the active organization.',
  })
  @ApiBigIntIdParam('id', 'user')
  async remove(
    @OrganizationId() organizationId: bigint,
    @Param('id') id: string,
  ) {
    await this.usersService.remove(organizationId, parseBigIntId(id));
  }
}
