import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LocalBootstrapStrategy } from './shared/bootstrap/bootstrap-strategies';

async function generateOpenApi() {
  const app = await NestFactory.create(AppModule, { logger: false });

  try {
    const bootstrapStrategy = new LocalBootstrapStrategy();
    await bootstrapStrategy.configure(app);
    await app.init();

    Logger.log(
      'OpenAPI spec written to apps/api/openapi/moduflow-api.json',
      'OpenApiGenerator',
    );
  } finally {
    await app.close();
  }
}

void generateOpenApi();
