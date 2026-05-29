import { INestApplication, Logger } from '@nestjs/common';
import { AppConfigurator } from './app-configurator';

type CorsOptions = NonNullable<Parameters<INestApplication['enableCors']>[0]>;

export abstract class BootstrapStrategy {
  abstract configure(app: INestApplication): Promise<void>;
  abstract start(app: INestApplication): Promise<void>;
}

abstract class BaseBootstrapStrategy extends BootstrapStrategy {
  protected constructor(
    protected readonly port = 3000,
    protected readonly corsOptions: CorsOptions = true,
  ) {
    super();
  }

  configure(app: INestApplication): Promise<void> {
    this.createConfigurator(app)
      .withApiPrefix()
      .withHelmet()
      .withCors(this.corsOptions)
      .withShutdownHooks();
    return Promise.resolve();
  }

  async start(app: INestApplication): Promise<void> {
    await this.configure(app);
    await app.listen(this.port);
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

  constructor(port?: number, corsOptions?: CorsOptions) {
    super(port, corsOptions);
  }

  override async start(app: INestApplication): Promise<void> {
    await super.start(app);
    const appUrl = this.normalizeLocalUrl(await app.getUrl());
    this.logger.log(`API running on port ${this.port}: ${appUrl}`);
  }
}

export class LocalBootstrapStrategy extends BaseBootstrapStrategy {
  private readonly logger = new Logger(BootstrapStrategy.name);

  constructor(port?: number, corsOptions?: CorsOptions) {
    super(port, corsOptions);
  }

  override configure(app: INestApplication): Promise<void> {
    this.createConfigurator(app)
      .withApiPrefix()
      .withHelmet()
      .withCors(this.corsOptions)
      .withShutdownHooks()
      .withSwagger();
    return Promise.resolve();
  }

  override async start(app: INestApplication): Promise<void> {
    await super.start(app);
    const appUrl = this.normalizeLocalUrl(await app.getUrl());
    this.logger.log(`API running on port ${this.port}: ${appUrl}`);
    this.logger.log(`Swagger UI: ${appUrl}/docs`);
    this.logger.log(`OpenAPI JSON: ${appUrl}/docs-json`);
  }
}

export class ProductionBootstrapStrategy extends BaseBootstrapStrategy {
  constructor(port?: number, corsOptions?: CorsOptions) {
    super(port, corsOptions);
  }
}

export class TestBootstrapStrategy extends BaseBootstrapStrategy {
  constructor(port?: number, corsOptions?: CorsOptions) {
    super(port, corsOptions);
  }

  override configure(app: INestApplication): Promise<void> {
    this.createConfigurator(app)
      .withQuietLogger()
      .withApiPrefix()
      .withHelmet()
      .withCors(this.corsOptions)
      .withShutdownHooks();
    return Promise.resolve();
  }
}
