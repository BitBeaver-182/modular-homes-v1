import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { HealthModule } from './global/health/health.module';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { OrganizationsModule } from './global/organizations/organizations.module';
import { BigIntSerializerInterceptor } from './common/interceptors/bigint-serializer.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { BootstrapModule } from './shared/bootstrap/bootstrap.module';
import { PlatformModule } from './platform/platform.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    AppConfigModule,
    AuthModule,
    BootstrapModule,
    DatabaseModule,
    HealthModule,
    PlatformModule,
    OrganizationsModule,
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
  ],
})
export class AppModule {}
