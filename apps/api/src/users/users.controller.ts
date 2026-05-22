import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { parseBigIntId } from '../common/ids/parse-bigint-id';
import { UserResponse } from './dto/user-response.dto';

type UserWithMembershipOrganizations = {
  memberships?: Array<{
    organization?: {
      id: bigint;
      name: string;
      slug: string;
      deletedAt: Date | null;
    } | null;
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

function toUserResponse(user: UserWithMembershipOrganizations): UserResponse {
  return plainToInstance(
    UserResponse,
    {
      ...user,
      organizations: (user.memberships ?? [])
        .map((membership) => membership.organization)
        .filter(isActiveOrganization),
    },
    {
      excludeExtraneousValues: true,
    },
  );
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return toUserResponse(user);
  }

  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map((user) => toUserResponse(user));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(parseBigIntId(id));
    return toUserResponse(user);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(
      parseBigIntId(id),
      updateUserDto,
    );
    return toUserResponse(user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const user = await this.usersService.remove(parseBigIntId(id));
    return toUserResponse(user);
  }
}
