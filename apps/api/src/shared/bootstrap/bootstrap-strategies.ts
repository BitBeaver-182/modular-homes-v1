import { INestApplication, Logger } from '@nestjs/common';
import { NodeEnv } from '../../config/env.validation';
import { configureApp } from './configure-app';

export abstract class BootstrapStrategy {
  abstract configure(app: INestApplication): void | Promise<void>;
  abstract start(app: INestApplication): void | Promise<void>;
}

abstract class BaseBootstrapStrategy extends BootstrapStrategy {
  private readonly logger = new Logger(BootstrapStrategy.name);

  constructor(
    private readonly nodeEnv: NodeEnv,
    private readonly quietLogger = false,
  ) {
    super();
  }

  configure(app: INestApplication): void {
    configureApp(app, {
      nodeEnv: this.nodeEnv,
      quietLogger: this.quietLogger,
    });
  }

  async start(app: INestApplication): Promise<void> {
    await this.configure(app);
    const port = Number(process.env.PORT ?? 3000);
    await app.listen(port);
    await this.logStartup(app, port);
  }

  protected async logStartup(
    _app: INestApplication,
    _port: number,
  ): Promise<void> {}

  protected log(message: string): void {
    this.logger.log(message);
  }

  protected normalizeLocalUrl(url: string): string {
    return url.replace('[::1]', 'localhost').replace('127.0.0.1', 'localhost');
  }
}

export class DevelopmentBootstrapStrategy extends BaseBootstrapStrategy {
  constructor() {
    super('development');
  }

  protected override async logStartup(
    app: INestApplication,
    port: number,
  ): Promise<void> {
    const appUrl = this.normalizeLocalUrl(await app.getUrl());
    this.log(`API running on port ${port}: ${appUrl}`);
  }
}

export class LocalBootstrapStrategy extends BaseBootstrapStrategy {
  constructor() {
    super('local');
  }

  protected override async logStartup(
    app: INestApplication,
    port: number,
  ): Promise<void> {
    const appUrl = this.normalizeLocalUrl(await app.getUrl());
    this.log(`API running on port ${port}: ${appUrl}`);
    this.log(`Swagger UI: ${appUrl}/docs`);
    this.log(`OpenAPI JSON: ${appUrl}/docs-json`);
  }
}

export class ProductionBootstrapStrategy extends BaseBootstrapStrategy {
  constructor() {
    super('production');
  }
}

export class TestBootstrapStrategy extends BaseBootstrapStrategy {
  constructor() {
    super('test', true);
  }
}
