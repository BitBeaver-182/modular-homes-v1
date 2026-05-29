import { Injectable } from '@nestjs/common';
import { doubleCsrf, type DoubleCsrfProtection } from 'csrf-csrf';
import { Request, Response, NextFunction } from 'express';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class CsrfProtectionService {
  private readonly csrfProtection: DoubleCsrfProtection;

  private readonly generateCsrfToken: (req: Request, res: Response) => string;

  private readonly invalidCsrfStatusCode: number;

  constructor(private readonly configService: AppConfigService) {
    const { doubleCsrfProtection, generateCsrfToken, invalidCsrfTokenError } =
      doubleCsrf({
        getSecret: () => this.configService.csrfSecret,
        getSessionIdentifier: (req) => this.getSessionIdentifier(req),
        cookieName:
          this.configService.nodeEnv === 'production'
            ? '__Host-moduflow.x-csrf-token'
            : 'moduflow.x-csrf-token',
        cookieOptions: {
          httpOnly: true,
          path: '/',
          sameSite:
            this.configService.nodeEnv === 'production' ? 'none' : 'lax',
          secure: this.configService.nodeEnv === 'production',
        },
        getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'],
        skipCsrfProtection: (req) => this.isBearerRequest(req),
      });

    this.csrfProtection = doubleCsrfProtection;
    this.generateCsrfToken = generateCsrfToken;
    this.invalidCsrfStatusCode = invalidCsrfTokenError.statusCode;
  }

  get middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      this.csrfProtection(req, res, (error?: unknown) => {
        if (this.isCsrfFailure(error) && !res.headersSent) {
          res.status(this.invalidCsrfStatusCode).json({
            message: 'Invalid CSRF token',
          });
          return;
        }

        next(error);
      });
    };
  }

  generateToken(req: Request, res: Response): string {
    return this.generateCsrfToken(req, res);
  }

  private getSessionIdentifier(req: Request): string {
    const authorizationHeader = req.headers.authorization;

    if (
      typeof authorizationHeader === 'string' &&
      authorizationHeader.length > 0
    ) {
      return authorizationHeader;
    }

    const forwardedForHeader = req.headers['x-forwarded-for'];
    const forwardedFor =
      typeof forwardedForHeader === 'string'
        ? forwardedForHeader.split(',')[0]?.trim()
        : req.ip;
    const userAgent = req.headers['user-agent'] ?? 'unknown';

    return `${forwardedFor ?? 'unknown'}:${userAgent}`;
  }

  private isBearerRequest(req: Request): boolean {
    return (
      typeof req.headers.authorization === 'string' &&
      req.headers.authorization.startsWith('Bearer ')
    );
  }

  private isCsrfFailure(error: unknown): error is { statusCode: number } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      error.statusCode === this.invalidCsrfStatusCode
    );
  }
}
