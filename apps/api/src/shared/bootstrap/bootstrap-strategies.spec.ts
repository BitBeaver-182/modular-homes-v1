const mockLoggerLog = jest.fn();
const configuratorMethods = {
  withQuietLogger: jest.fn(),
  withApiPrefix: jest.fn(),
  withHelmet: jest.fn(),
  withCors: jest.fn(),
  withShutdownHooks: jest.fn(),
  withSwagger: jest.fn(),
};

jest.mock('./app-configurator', () => {
  const instance = {
    withQuietLogger: configuratorMethods.withQuietLogger.mockReturnThis(),
    withApiPrefix: configuratorMethods.withApiPrefix.mockReturnThis(),
    withHelmet: configuratorMethods.withHelmet.mockReturnThis(),
    withCors: configuratorMethods.withCors.mockReturnThis(),
    withShutdownHooks: configuratorMethods.withShutdownHooks.mockReturnThis(),
    withSwagger: configuratorMethods.withSwagger.mockReturnThis(),
  };

  return {
    AppConfigurator: jest.fn(() => instance),
  };
});

jest.mock('@nestjs/common', () => {
  const actual =
    jest.requireActual<typeof import('@nestjs/common')>('@nestjs/common');

  return {
    ...actual,
    Logger: class LoggerMock {
      log = mockLoggerLog;
    },
  };
});

import { INestApplication } from '@nestjs/common';
import { AppConfigurator } from './app-configurator';
import {
  BootstrapStrategy,
  DevelopmentBootstrapStrategy,
  LocalBootstrapStrategy,
  ProductionBootstrapStrategy,
  TestBootstrapStrategy,
} from './bootstrap-strategies';

describe('bootstrap strategies', () => {
  const mockListen = jest.fn<Promise<void>, [number]>();
  const mockGetUrl = jest.fn<Promise<string>, []>();
  const corsOptions = { origin: 'https://dashboard.example.com' };
  const app = {
    listen: mockListen,
    getUrl: mockGetUrl,
  } as unknown as INestApplication;

  beforeEach(() => {
    jest.clearAllMocks();
    mockListen.mockResolvedValue(undefined);
    mockGetUrl.mockResolvedValue('http://[::1]:3000');
  });

  it('exposes a shared bootstrap strategy base type', () => {
    expect(new DevelopmentBootstrapStrategy()).toBeInstanceOf(
      BootstrapStrategy,
    );
    expect(new LocalBootstrapStrategy()).toBeInstanceOf(BootstrapStrategy);
    expect(new ProductionBootstrapStrategy()).toBeInstanceOf(BootstrapStrategy);
    expect(new TestBootstrapStrategy()).toBeInstanceOf(BootstrapStrategy);
  });

  it('configures test apps without listening', async () => {
    await new TestBootstrapStrategy(undefined, corsOptions).configure(app);

    expect(AppConfigurator).toHaveBeenCalledWith(app);
    expect(configuratorMethods.withQuietLogger).toHaveBeenCalled();
    expect(configuratorMethods.withApiPrefix).toHaveBeenCalled();
    expect(configuratorMethods.withHelmet).toHaveBeenCalled();
    expect(configuratorMethods.withCors).toHaveBeenCalledWith(corsOptions);
    expect(configuratorMethods.withShutdownHooks).toHaveBeenCalled();
    expect(configuratorMethods.withSwagger).not.toHaveBeenCalled();
    expect(mockListen).not.toHaveBeenCalled();
    expect(mockLoggerLog).not.toHaveBeenCalled();
  });

  it('starts development apps and logs the application url', async () => {
    await new DevelopmentBootstrapStrategy(undefined, corsOptions).start(app);

    expect(AppConfigurator).toHaveBeenCalledWith(app);
    expect(configuratorMethods.withQuietLogger).not.toHaveBeenCalled();
    expect(configuratorMethods.withApiPrefix).toHaveBeenCalled();
    expect(configuratorMethods.withHelmet).toHaveBeenCalled();
    expect(configuratorMethods.withCors).toHaveBeenCalledWith(corsOptions);
    expect(configuratorMethods.withShutdownHooks).toHaveBeenCalled();
    expect(configuratorMethods.withSwagger).not.toHaveBeenCalled();
    expect(mockListen).toHaveBeenCalledWith(3000);
    expect(mockLoggerLog).toHaveBeenCalledWith(
      'API running on port 3000: http://localhost:3000',
    );
  });

  it('starts local apps and logs application and swagger urls', async () => {
    mockGetUrl.mockResolvedValue('http://127.0.0.1:4100');

    await new LocalBootstrapStrategy(4100, corsOptions).start(app);

    expect(AppConfigurator).toHaveBeenCalledWith(app);
    expect(configuratorMethods.withQuietLogger).not.toHaveBeenCalled();
    expect(configuratorMethods.withApiPrefix).toHaveBeenCalled();
    expect(configuratorMethods.withHelmet).toHaveBeenCalled();
    expect(configuratorMethods.withCors).toHaveBeenCalledWith(corsOptions);
    expect(configuratorMethods.withShutdownHooks).toHaveBeenCalled();
    expect(configuratorMethods.withSwagger).toHaveBeenCalled();
    expect(mockListen).toHaveBeenCalledWith(4100);
    expect(mockLoggerLog).toHaveBeenNthCalledWith(
      1,
      'API running on port 4100: http://localhost:4100',
    );
    expect(mockLoggerLog).toHaveBeenNthCalledWith(
      2,
      'Swagger UI: http://localhost:4100/docs',
    );
    expect(mockLoggerLog).toHaveBeenNthCalledWith(
      3,
      'OpenAPI JSON: http://localhost:4100/docs-json',
    );
  });

  it('starts production apps without the quiet logger', async () => {
    await new ProductionBootstrapStrategy(undefined, corsOptions).start(app);

    expect(AppConfigurator).toHaveBeenCalledWith(app);
    expect(configuratorMethods.withQuietLogger).not.toHaveBeenCalled();
    expect(configuratorMethods.withApiPrefix).toHaveBeenCalled();
    expect(configuratorMethods.withHelmet).toHaveBeenCalled();
    expect(configuratorMethods.withCors).toHaveBeenCalledWith(corsOptions);
    expect(configuratorMethods.withShutdownHooks).toHaveBeenCalled();
    expect(configuratorMethods.withSwagger).not.toHaveBeenCalled();
    expect(mockListen).toHaveBeenCalledWith(3000);
    expect(mockLoggerLog).not.toHaveBeenCalled();
  });

  it('starts test apps with the quiet logger enabled', async () => {
    await new TestBootstrapStrategy(undefined, corsOptions).start(app);

    expect(AppConfigurator).toHaveBeenCalledWith(app);
    expect(configuratorMethods.withQuietLogger).toHaveBeenCalled();
    expect(configuratorMethods.withApiPrefix).toHaveBeenCalled();
    expect(configuratorMethods.withHelmet).toHaveBeenCalled();
    expect(configuratorMethods.withCors).toHaveBeenCalledWith(corsOptions);
    expect(configuratorMethods.withShutdownHooks).toHaveBeenCalled();
    expect(configuratorMethods.withSwagger).not.toHaveBeenCalled();
    expect(mockListen).toHaveBeenCalledWith(3000);
    expect(mockLoggerLog).not.toHaveBeenCalled();
  });
});
