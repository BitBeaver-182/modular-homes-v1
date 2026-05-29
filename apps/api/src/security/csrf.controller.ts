import { Controller, Get, Req, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Response, type Request } from 'express';
import { Public } from '../auth/decorator/public.decorator';
import { CsrfProtectionService } from './csrf-protection.service';

@ApiTags('Security')
@Controller('auth')
export class CsrfController {
  constructor(private readonly csrfProtectionService: CsrfProtectionService) {}

  @Public()
  @Get('csrf')
  @ApiOperation({
    summary: 'Issue CSRF token',
    description:
      'Issue a CSRF token and matching cookie for browser-based cookie-authenticated requests. Bearer-token clients do not need this endpoint.',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        csrfToken: { type: 'string' },
      },
    },
  })
  issueToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return {
      csrfToken: this.csrfProtectionService.generateToken(req, res),
    };
  }
}
