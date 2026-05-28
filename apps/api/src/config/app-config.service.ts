import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppEnv } from './env.validation';

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

  get jwtSecret(): string {
    return (
      this.configService.get<AppEnv['JWT_SECRET']>('JWT_SECRET') ??
      'moduflow-local-jwt-secret'
    );
  }
}
