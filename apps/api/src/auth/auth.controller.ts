import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from './decorator/current-user.decorator';
import { Public } from './decorator/public.decorator';
import { CreateTokenDto } from './dto/create-token.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { JwtGuard } from './guard/jwt.guard';
import { AuthService } from './auth.service';
import type { AuthUser } from './auth.types';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register user',
    description: 'Create a new global user account and issue a JWT.',
  })
  @ApiBody({ type: RegisterUserDto })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string', nullable: true },
            avatarUrl: { type: 'string', nullable: true },
          },
        },
      },
    },
  })
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.registerUser(registerUserDto);
  }

  @Public()
  @Post('token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Issue access token',
    description:
      'Issue a JWT for an existing active user with email and password credentials.',
  })
  @ApiBody({ type: CreateTokenDto })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
        },
      },
    },
  })
  async createToken(@Body() createTokenDto: CreateTokenDto) {
    return this.authService.issueTokenForCredentials(createTokenDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticate with email and password and issue a JWT.',
  })
  @ApiBody({ type: CreateTokenDto })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string', nullable: true },
            avatarUrl: { type: 'string', nullable: true },
          },
        },
      },
    },
  })
  async login(@Body() createTokenDto: CreateTokenDto) {
    return this.authService.login(createTokenDto);
  }

  @UseGuards(JwtGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current actor',
    description: 'Return the authenticated actor from the bearer token.',
  })
  me(@CurrentUser() user: AuthUser) {
    return {
      userId: user.userId.toString(),
      email: user.email,
    };
  }

  @UseGuards(JwtGuard)
  @Get('session')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current session',
    description:
      'Return the authenticated user and active organization memberships.',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string', nullable: true },
            avatarUrl: { type: 'string', nullable: true },
          },
        },
        memberships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              governanceRole: { type: 'string', enum: ['owner', 'member'] },
              organization: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  slug: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  })
  session(@CurrentUser() user: AuthUser) {
    return this.authService.getSession(user);
  }
}
