import { INestApplication } from '@nestjs/common';
import { AppConfigurator } from './app-configurator';

export abstract class BootstrapStrategy {
  abstract configure(app: INestApplication): void | Promise<void>;
}

export class DevelopmentBootstrapStrategy extends BootstrapStrategy {
  configure(app: INestApplication): void {
    new AppConfigurator(app)
      .withApiPrefix()
      .withCors()
      .withSwagger()
      .withShutdownHooks();
  }
}

export class ProductionBootstrapStrategy extends BootstrapStrategy {
  configure(app: INestApplication): void {
    new AppConfigurator(app).withApiPrefix().withCors().withShutdownHooks();
  }
}

export class TestBootstrapStrategy extends BootstrapStrategy {
  configure(app: INestApplication): void {
    void app;
  }
}
