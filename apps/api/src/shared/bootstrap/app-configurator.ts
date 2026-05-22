import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export class AppConfigurator {
  constructor(private readonly app: INestApplication) {}

  withApiPrefix(prefix = 'api'): this {
    this.app.setGlobalPrefix(prefix);
    return this;
  }

  withCors(
    options: Parameters<INestApplication['enableCors']>[0] = true,
  ): this {
    this.app.enableCors(options);
    return this;
  }

  withSwagger(): this {
    const document = SwaggerModule.createDocument(
      this.app,
      new DocumentBuilder()
        .setTitle('Moduflow API')
        .setDescription('Moduflow API documentation')
        .setVersion('1.0')
        .build(),
    );

    const outputDirectory = resolve(__dirname, '..', '..', '..', 'openapi');
    mkdirSync(outputDirectory, { recursive: true });
    writeFileSync(
      resolve(outputDirectory, 'moduflow-api.json'),
      JSON.stringify(document, null, 2),
    );

    SwaggerModule.setup('docs', this.app, document);
    return this;
  }

  withShutdownHooks(): this {
    this.app.enableShutdownHooks();
    return this;
  }

  withQuietLogger(): this {
    this.app.useLogger(false);
    return this;
  }
}
