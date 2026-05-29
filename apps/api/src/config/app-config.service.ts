import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppEnv } from './env.validation';

type CorsOriginCallback = (error: Error | null, allow?: boolean) => void;

export interface AppCorsOptions {
  allowedHeaders: string[];
  credentials: boolean;
  methods: string[];
  optionsSuccessStatus: number;
  origin: (origin: string | undefined, callback: CorsOriginCallback) => void;
}

const DEFAULT_CORS_ORIGINS = [
  'http://localhost:5180',
  'http://127.0.0.1:5180',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];
const DEFAULT_THROTTLE_TTL_MS = 60_000;
const DEFAULT_THROTTLE_LIMIT = 20;
const DEFAULT_CSRF_SECRET = 'moduflow-local-csrf-secret';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<AppEnv, true>) {}

  get nodeEnv(): AppEnv['NODE_ENV'] {
    return this.configService.getOrThrow<AppEnv['NODE_ENV']>('NODE_ENV');
  }

  get databaseUrl(): string {
    return this.configService.getOrThrow<AppEnv['DATABASE_URL']>(
      'DATABASE_URL',
    );
  }

  get directUrl(): string {
    return this.configService.getOrThrow<AppEnv['DIRECT_URL']>('DIRECT_URL');
  }

  get port(): number {
    return this.configService.getOrThrow<AppEnv['PORT']>('PORT');
  }

  get corsOrigins(): string[] {
    const configuredOrigins =
      this.configService.get<AppEnv['CORS_ORIGINS']>('CORS_ORIGINS');

    if (!configuredOrigins) {
      return DEFAULT_CORS_ORIGINS;
    }

    return configuredOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0)
      .map((origin) => origin.replace(/\/+$/, ''));
  }

  get corsAllowCredentials(): boolean {
    return (
      this.configService.get<AppEnv['CORS_ALLOW_CREDENTIALS']>(
        'CORS_ALLOW_CREDENTIALS',
      ) ?? true
    );
  }

  get corsOptions(): AppCorsOptions {
    const allowedOrigins = new Set(this.corsOrigins);

    return {
      allowedHeaders: ['Authorization', 'Content-Type', 'X-CSRF-Token'],
      credentials: this.corsAllowCredentials,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      optionsSuccessStatus: 204,
      origin: (origin: string | undefined, callback: CorsOriginCallback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        const normalizedOrigin = origin.replace(/\/+$/, '');

        if (allowedOrigins.has(normalizedOrigin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
      },
    };
  }

  get throttleTtlMs(): number {
    return (
      this.configService.get<AppEnv['THROTTLE_TTL_MS']>('THROTTLE_TTL_MS') ??
      DEFAULT_THROTTLE_TTL_MS
    );
  }

  get throttleLimit(): number {
    return (
      this.configService.get<AppEnv['THROTTLE_LIMIT']>('THROTTLE_LIMIT') ??
      DEFAULT_THROTTLE_LIMIT
    );
  }

  get csrfSecret(): string {
    return (
      this.configService.get<AppEnv['CSRF_SECRET']>('CSRF_SECRET') ??
      DEFAULT_CSRF_SECRET
    );
  }

  get jwtSecret(): string {
    return (
      this.configService.get<AppEnv['JWT_SECRET']>('JWT_SECRET') ??
      'moduflow-local-jwt-secret'
    );
  }
}
