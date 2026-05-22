import { INestApplication } from '@nestjs/common';
import { NodeEnv } from '../../config/env.validation';
import { configureApp } from './configure-app';

export abstract class BootstrapStrategy {
  abstract configure(app: INestApplication): void | Promise<void>;
}

abstract class BaseBootstrapStrategy extends BootstrapStrategy {
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
}

export class DevelopmentBootstrapStrategy extends BaseBootstrapStrategy {
  constructor() {
    super('development');
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
