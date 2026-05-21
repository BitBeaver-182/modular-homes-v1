import { INestApplication } from '@nestjs/common';
import { NodeEnv } from '../../config/env.validation';
import { AppConfigurator } from './app-configurator';

type ConfigureAppOptions = {
  nodeEnv: NodeEnv;
  quietLogger?: boolean;
};

export async function configureApp(
  app: INestApplication,
  options: ConfigureAppOptions,
): Promise<void> {
  const configurator = new AppConfigurator(app);

  if (options.quietLogger) {
    configurator.withQuietLogger();
  }

  configurator.withApiPrefix().withCors().withShutdownHooks();

  if (options.nodeEnv === 'development') {
    configurator.withSwagger();
  }
}
