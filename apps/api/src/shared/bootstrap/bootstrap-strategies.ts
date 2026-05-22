import { INestApplication, Logger } from '@nestjs/common';
import { AppConfigurator } from './app-configurator';

export abstract class BootstrapStrategy {
  abstract configure(app: INestApplication): Promise<void>;
  abstract start(app: INestApplication): Promise<void>;
}

abstract class BaseBootstrapStrategy extends BootstrapStrategy {
  protected constructor() {
    super();
  }

  configure(app: INestApplication): Promise<void> {
    this.createConfigurator(app).withApiPrefix().withCors().withShutdownHooks();
    return Promise.resolve();
  }

  async start(app: INestApplication): Promise<void> {
    await this.configure(app);
    const port = Number(process.env.PORT ?? 3000);
    await app.listen(port);
  }

  protected createConfigurator(app: INestApplication): AppConfigurator {
    return new AppConfigurator(app);
  }

  protected normalizeLocalUrl(url: string): string {
    return url.replace('[::1]', 'localhost').replace('127.0.0.1', 'localhost');
  }
}

export class DevelopmentBootstrapStrategy extends BaseBootstrapStrategy {
  private readonly logger = new Logger(BootstrapStrategy.name);

  constructor() {
    super();
  }

  override async start(app: INestApplication): Promise<void> {
    await super.start(app);
    const port = Number(process.env.PORT ?? 3000);
    const appUrl = this.normalizeLocalUrl(await app.getUrl());
    this.logger.log(`API running on port ${port}: ${appUrl}`);
  }
}

export class LocalBootstrapStrategy extends BaseBootstrapStrategy {
  private readonly logger = new Logger(BootstrapStrategy.name);

  constructor() {
    super();
  }

  override configure(app: INestApplication): Promise<void> {
    this.createConfigurator(app)
      .withApiPrefix()
      .withCors()
      .withShutdownHooks()
      .withSwagger();
    return Promise.resolve();
  }

  override async start(app: INestApplication): Promise<void> {
    await super.start(app);
    const port = Number(process.env.PORT ?? 3000);
    const appUrl = this.normalizeLocalUrl(await app.getUrl());
    this.logger.log(`API running on port ${port}: ${appUrl}`);
    this.logger.log(`Swagger UI: ${appUrl}/docs`);
    this.logger.log(`OpenAPI JSON: ${appUrl}/docs-json`);
  }
}

export class ProductionBootstrapStrategy extends BaseBootstrapStrategy {
  constructor() {
    super();
  }
}

export class TestBootstrapStrategy extends BaseBootstrapStrategy {
  constructor() {
    super();
  }

  override configure(app: INestApplication): Promise<void> {
    this.createConfigurator(app)
      .withQuietLogger()
      .withApiPrefix()
      .withCors()
      .withShutdownHooks();
    return Promise.resolve();
  }
}
