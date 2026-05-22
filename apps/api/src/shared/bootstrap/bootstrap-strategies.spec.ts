jest.mock('./configure-app', () => ({
  configureApp: jest.fn(),
}));

const mockLoggerLog = jest.fn();

jest.mock('@nestjs/common', () => {
  const actual = jest.requireActual('@nestjs/common');

  return {
    ...actual,
    Logger: class LoggerMock {
      log = mockLoggerLog;
    },
  };
});

import { INestApplication } from '@nestjs/common';
import { configureApp } from './configure-app';
import {
  BootstrapStrategy,
  DevelopmentBootstrapStrategy,
  LocalBootstrapStrategy,
  ProductionBootstrapStrategy,
  TestBootstrapStrategy,
} from './bootstrap-strategies';

describe('bootstrap strategies', () => {
  const app = {
    listen: jest.fn(),
    getUrl: jest.fn(),
  } as unknown as INestApplication;

  beforeEach(() => {
    jest.clearAllMocks();
    app.listen = jest.fn().mockResolvedValue(undefined);
    app.getUrl = jest.fn().mockResolvedValue('http://[::1]:3000');
    delete process.env.PORT;
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
    await new TestBootstrapStrategy().configure(app);

    expect(configureApp).toHaveBeenCalledWith(app, {
      nodeEnv: 'test',
      quietLogger: true,
    });
    expect(app.listen).not.toHaveBeenCalled();
    expect(mockLoggerLog).not.toHaveBeenCalled();
  });

  it('starts development apps and logs the application url', async () => {
    await new DevelopmentBootstrapStrategy().start(app);

    expect(configureApp).toHaveBeenCalledWith(app, {
      nodeEnv: 'development',
      quietLogger: false,
    });
    expect(app.listen).toHaveBeenCalledWith(3000);
    expect(mockLoggerLog).toHaveBeenCalledWith(
      'API running on port 3000: http://localhost:3000',
    );
  });

  it('starts local apps and logs application and swagger urls', async () => {
    process.env.PORT = '4100';
    app.getUrl = jest.fn().mockResolvedValue('http://127.0.0.1:4100');

    await new LocalBootstrapStrategy().start(app);

    expect(configureApp).toHaveBeenCalledWith(app, {
      nodeEnv: 'local',
      quietLogger: false,
    });
    expect(app.listen).toHaveBeenCalledWith(4100);
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
    await new ProductionBootstrapStrategy().start(app);

    expect(configureApp).toHaveBeenCalledWith(app, {
      nodeEnv: 'production',
      quietLogger: false,
    });
    expect(app.listen).toHaveBeenCalledWith(3000);
    expect(mockLoggerLog).not.toHaveBeenCalled();
  });

  it('starts test apps with the quiet logger enabled', async () => {
    await new TestBootstrapStrategy().start(app);

    expect(configureApp).toHaveBeenCalledWith(app, {
      nodeEnv: 'test',
      quietLogger: true,
    });
    expect(app.listen).toHaveBeenCalledWith(3000);
    expect(mockLoggerLog).not.toHaveBeenCalled();
  });
});
