import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppConfigService } from './config/app-config.service';
import { CsrfProtectionService } from './security/csrf-protection.service';
import { AppModule } from './app.module';
import { BootstrapStrategy } from './shared/bootstrap/bootstrap-strategies';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(AppConfigService);
  const csrfProtectionService = app.get(CsrfProtectionService);
  const bootstrapStrategy = app.get(BootstrapStrategy);

  app.use(cookieParser(configService.csrfSecret));
  app.use(csrfProtectionService.middleware);

  await bootstrapStrategy.start(app);
}

void bootstrap();
