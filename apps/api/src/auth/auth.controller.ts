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
import { plainToInstance } from 'class-transformer';
import {
  AuthResponsePresenter,
  AuthTokenPresenter,
  CurrentActorPresenter,
  SessionResponsePresenter,
} from './dto/auth-response.dto';
import { CurrentUser } from './decorator/current-user.decorator';
import { Public } from './decorator/public.decorator';
import { CreateTokenDto } from './dto/create-token.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { JwtGuard } from './guard/jwt.guard';
import { AuthService } from './auth.service';
import type { AuthUser } from './auth.types';
import { toCurrentActorResponse } from './mappers/auth.mapper';

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
  @ApiOkResponse({ type: AuthResponsePresenter })
  async register(@Body() registerUserDto: RegisterUserDto) {
    return plainToInstance(
      AuthResponsePresenter,
      await this.authService.registerUser(registerUserDto),
      { excludeExtraneousValues: true },
    );
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
  @ApiOkResponse({ type: AuthTokenPresenter })
  async createToken(@Body() createTokenDto: CreateTokenDto) {
    return plainToInstance(
      AuthTokenPresenter,
      await this.authService.issueTokenForCredentials(createTokenDto),
      { excludeExtraneousValues: true },
    );
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticate with email and password and issue a JWT.',
  })
  @ApiBody({ type: CreateTokenDto })
  @ApiOkResponse({ type: AuthResponsePresenter })
  async login(@Body() createTokenDto: CreateTokenDto) {
    return plainToInstance(
      AuthResponsePresenter,
      await this.authService.login(createTokenDto),
      { excludeExtraneousValues: true },
    );
  }

  @UseGuards(JwtGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current actor',
    description: 'Return the authenticated actor from the bearer token.',
  })
  @ApiOkResponse({ type: CurrentActorPresenter })
  me(@CurrentUser() user: AuthUser) {
    return plainToInstance(
      CurrentActorPresenter,
      toCurrentActorResponse(user),
      {
        excludeExtraneousValues: true,
      },
    );
  }

  @UseGuards(JwtGuard)
  @Get('session')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current session',
    description:
      'Return the authenticated user and active organization memberships.',
  })
  @ApiOkResponse({ type: SessionResponsePresenter })
  async session(@CurrentUser() user: AuthUser) {
    return plainToInstance(
      SessionResponsePresenter,
      await this.authService.getSession(user),
      { excludeExtraneousValues: true },
    );
  }
}
