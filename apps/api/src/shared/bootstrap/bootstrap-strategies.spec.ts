jest.mock('./configure-app', () => ({
  configureApp: jest.fn(),
}));

import { INestApplication } from '@nestjs/common';
import { configureApp } from './configure-app';
import {
  BootstrapStrategy,
  DevelopmentBootstrapStrategy,
  ProductionBootstrapStrategy,
  TestBootstrapStrategy,
} from './bootstrap-strategies';

describe('bootstrap strategies', () => {
  const app = {} as INestApplication;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exposes a shared bootstrap strategy base type', () => {
    expect(new DevelopmentBootstrapStrategy()).toBeInstanceOf(
      BootstrapStrategy,
    );
    expect(new ProductionBootstrapStrategy()).toBeInstanceOf(BootstrapStrategy);
    expect(new TestBootstrapStrategy()).toBeInstanceOf(BootstrapStrategy);
  });

  it('configures development apps with swagger enabled later', () => {
    new DevelopmentBootstrapStrategy().configure(app);

    expect(configureApp).toHaveBeenCalledWith(app, {
      nodeEnv: 'development',
      quietLogger: false,
    });
  });

  it('configures production apps without the quiet logger', () => {
    new ProductionBootstrapStrategy().configure(app);

    expect(configureApp).toHaveBeenCalledWith(app, {
      nodeEnv: 'production',
      quietLogger: false,
    });
  });

  it('configures test apps with the quiet logger enabled', () => {
    new TestBootstrapStrategy().configure(app);

    expect(configureApp).toHaveBeenCalledWith(app, {
      nodeEnv: 'test',
      quietLogger: true,
    });
  });
});
