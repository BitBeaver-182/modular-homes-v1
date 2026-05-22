import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BootstrapStrategy } from './shared/bootstrap/bootstrap-strategies';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const bootstrapStrategy = app.get(BootstrapStrategy);

  await bootstrapStrategy.start(app);
}

void bootstrap();
