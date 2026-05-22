import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
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
import { JwtGuard } from './guard/jwt.guard';
import { AuthService } from './auth.service';
import type { AuthUser } from './auth.types';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('token')
  @ApiOperation({
    summary: 'Issue access token',
    description: 'Issue a JWT for an existing active user by email.',
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
    return this.authService.issueTokenForEmail(createTokenDto.email);
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
}
