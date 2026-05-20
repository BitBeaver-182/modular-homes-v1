import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppEnv } from './env.validation';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<AppEnv, true>) { }

  get nodeEnv(): AppEnv['NODE_ENV'] {
    return this.configService.getOrThrow<AppEnv['NODE_ENV']>('NODE_ENV');
  }

  get databaseUrl(): string {
    return this.configService.getOrThrow<AppEnv['DATABASE_URL']>('DATABASE_URL');
  }
}
