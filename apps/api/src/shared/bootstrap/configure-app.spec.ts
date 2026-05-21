const configuratorMethods = {
  withQuietLogger: jest.fn(),
  withApiPrefix: jest.fn(),
  withCors: jest.fn(),
  withShutdownHooks: jest.fn(),
  withSwagger: jest.fn(),
};

jest.mock('./app-configurator', () => {
  const instance = {
    withQuietLogger: configuratorMethods.withQuietLogger.mockReturnThis(),
    withApiPrefix: configuratorMethods.withApiPrefix.mockReturnThis(),
    withCors: configuratorMethods.withCors.mockReturnThis(),
    withShutdownHooks: configuratorMethods.withShutdownHooks.mockReturnThis(),
    withSwagger: configuratorMethods.withSwagger.mockReturnThis(),
  };

  return {
    AppConfigurator: jest.fn(() => instance),
  };
});

import { INestApplication } from '@nestjs/common';
import { AppConfigurator } from './app-configurator';
import { configureApp } from './configure-app';

describe('configureApp', () => {
  const app = {} as INestApplication;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('configures the base application behavior', () => {
    configureApp(app, { nodeEnv: 'production' });

    expect(AppConfigurator).toHaveBeenCalledWith(app);
    expect(configuratorMethods.withQuietLogger).not.toHaveBeenCalled();
    expect(configuratorMethods.withApiPrefix).toHaveBeenCalled();
    expect(configuratorMethods.withCors).toHaveBeenCalled();
    expect(configuratorMethods.withShutdownHooks).toHaveBeenCalled();
    expect(configuratorMethods.withSwagger).not.toHaveBeenCalled();
  });

  it('enables the quiet logger when requested', () => {
    configureApp(app, { nodeEnv: 'test', quietLogger: true });

    expect(configuratorMethods.withQuietLogger).toHaveBeenCalled();
  });

  it('enables swagger in development only', () => {
    configureApp(app, { nodeEnv: 'development' });

    expect(configuratorMethods.withSwagger).toHaveBeenCalled();
  });
});
