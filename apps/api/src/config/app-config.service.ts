import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppEnv, DatabaseType } from './env.validation';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<AppEnv, true>) { }

  get nodeEnv(): AppEnv['NODE_ENV'] {
    return this.configService.getOrThrow<AppEnv['NODE_ENV']>('NODE_ENV');
  }

  get databaseUrl(): string {
    return this.configService.getOrThrow<AppEnv['DATABASE_URL']>('DATABASE_URL');
  }

  get databaseType(): DatabaseType {
    const protocol = new URL(this.databaseUrl).protocol.replace(':', '');

    if (protocol === 'postgres' || protocol === 'postgresql') {
      return 'postgresql';
    }
    if (protocol === 'mysql') {
      return 'mysql';
    }
    if (protocol === 'mongodb') {
      return 'mongodb';
    }

    throw new Error(`Unsupported database protocol in DATABASE_URL: ${protocol}`);
  }
}
