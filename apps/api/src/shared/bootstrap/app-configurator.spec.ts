import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { AppConfigurator } from './app-configurator';

describe('AppConfigurator', () => {
  const app = {
    setGlobalPrefix: jest.fn(),
    enableCors: jest.fn(),
    enableShutdownHooks: jest.fn(),
    useLogger: jest.fn(),
  };

  let configurator: AppConfigurator;

  beforeEach(() => {
    jest.resetAllMocks();
    configurator = new AppConfigurator(app as unknown as INestApplication);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sets the api prefix and returns itself', () => {
    expect(configurator.withApiPrefix()).toBe(configurator);
    expect(app.setGlobalPrefix).toHaveBeenCalledWith('api');

    configurator.withApiPrefix('v2');
    expect(app.setGlobalPrefix).toHaveBeenCalledWith('v2');
  });

  it('enables cors with the provided options and returns itself', () => {
    const options = { origin: 'https://example.com' };

    expect(configurator.withCors(options)).toBe(configurator);
    expect(app.enableCors).toHaveBeenCalledWith(options);
  });

  it('enables cors with the default setting when no options are provided', () => {
    configurator.withCors();
    expect(app.enableCors).toHaveBeenCalledWith(true);
  });

  it('configures swagger and returns itself', () => {
    const createDocumentSpy = jest
      .spyOn(SwaggerModule, 'createDocument')
      .mockReturnValue({ openapi: '3.0.0' } as never);
    const setupSpy = jest.spyOn(SwaggerModule, 'setup').mockImplementation();

    expect(configurator.withSwagger()).toBe(configurator);
    expect(createDocumentSpy).toHaveBeenCalledWith(
      app,
      expect.objectContaining({
        info: expect.objectContaining({
          title: 'Moduflow API',
          description: 'Moduflow API documentation',
          version: '1.0',
        }),
      }) as ReturnType<DocumentBuilder['build']>,
    );
    expect(setupSpy).toHaveBeenCalledWith(
      '/docs',
      app,
      expect.objectContaining({ openapi: '3.0.0' }),
    );
  });

  it('enables shutdown hooks and can silence the logger', () => {
    expect(configurator.withShutdownHooks()).toBe(configurator);
    expect(app.enableShutdownHooks).toHaveBeenCalled();

    expect(configurator.withQuietLogger()).toBe(configurator);
    expect(app.useLogger).toHaveBeenCalledWith(false);
  });
});
