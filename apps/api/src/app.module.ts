import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { QuerybuilderModule } from 'nestjs-prisma-querybuilder';
import { HealthModule } from './global/health/health.module';
import { AppConfigModule } from './config/app-config.module';
import { AppConfigService } from './config/app-config.service';
import { DatabaseModule } from './database/database.module';
import { PrismaService } from './database/prisma.service';
import { OrganizationsModule } from './global/organizations/organizations.module';
import { BigIntSerializerInterceptor } from './common/interceptors/bigint-serializer.interceptor';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { BootstrapModule } from './shared/bootstrap/bootstrap.module';
import { PlatformModule } from './platform/platform.module';
import { AuthModule } from './auth/auth.module';

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
    QuerybuilderModule.forRootAsync({
      imports: [DatabaseModule],
      inject: [PrismaService],
      useFactory: (...args: unknown[]) => ({
        prisma: args[0] as PrismaService,
        maxTake: 100,
      }),
    }),
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
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
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
