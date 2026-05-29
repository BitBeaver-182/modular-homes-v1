import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './global/health/health.module';
import { AppConfigModule } from './config/app-config.module';
import { AppConfigService } from './config/app-config.service';
import { DatabaseModule } from './database/database.module';
import { OrganizationsModule } from './global/organizations/organizations.module';
import { BigIntSerializerInterceptor } from './common/interceptors/bigint-serializer.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { BootstrapModule } from './shared/bootstrap/bootstrap.module';
import { PlatformModule } from './platform/platform.module';
import { AuthModule } from './auth/auth.module';
import { SecurityModule } from './security/security.module';

@Module({
  imports: [
    AppConfigModule,
    ThrottlerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => [
        {
          ttl: configService.throttleTtlMs,
          limit: configService.throttleLimit,
        },
      ],
    }),
    AuthModule,
    BootstrapModule,
    DatabaseModule,
    HealthModule,
    PlatformModule,
    OrganizationsModule,
    SecurityModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: BigIntSerializerInterceptor,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
