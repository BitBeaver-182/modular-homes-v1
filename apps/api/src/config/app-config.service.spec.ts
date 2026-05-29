import { ConfigService } from '@nestjs/config';
import { AppConfigService } from './app-config.service';

describe('AppConfigService', () => {
  const configService = {
    getOrThrow: jest.fn(),
    get: jest.fn(),
  };

  let service: AppConfigService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new AppConfigService(
      configService as unknown as ConfigService<never, true>,
    );
  });

  it('returns nodeEnv from the config service', () => {
    configService.getOrThrow.mockReturnValue('test');

    expect(service.nodeEnv).toBe('test');
    expect(configService.getOrThrow).toHaveBeenCalledWith('NODE_ENV');
  });

  it('returns databaseUrl from the config service', () => {
    configService.getOrThrow.mockReturnValue('postgresql://db');

    expect(service.databaseUrl).toBe('postgresql://db');
    expect(configService.getOrThrow).toHaveBeenCalledWith('DATABASE_URL');
  });

  it('returns directUrl from the config service', () => {
    configService.getOrThrow.mockReturnValue('postgresql://direct');

    expect(service.directUrl).toBe('postgresql://direct');
    expect(configService.getOrThrow).toHaveBeenCalledWith('DIRECT_URL');
  });

  it('returns port from the config service', () => {
    configService.getOrThrow.mockReturnValue(3001);

    expect(service.port).toBe(3001);
    expect(configService.getOrThrow).toHaveBeenCalledWith('PORT');
  });

  it('returns default cors origins when not configured', () => {
    configService.get.mockReturnValue(undefined);

    expect(service.corsOrigins).toEqual([
      'http://localhost:5180',
      'http://127.0.0.1:5180',
      'http://localhost:4173',
      'http://127.0.0.1:4173',
    ]);
  });

  it('returns normalized configured cors origins', () => {
    configService.get.mockReturnValue(
      'https://dashboard.example.com/, https://admin.example.com',
    );

    expect(service.corsOrigins).toEqual([
      'https://dashboard.example.com',
      'https://admin.example.com',
    ]);
  });

  it('returns the configured cors credentials flag', () => {
    configService.get.mockReturnValue(false);

    expect(service.corsAllowCredentials).toBe(false);
  });

  it('builds cors options that allow configured origins and no-origin requests', () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'CORS_ORIGINS') {
        return 'https://dashboard.example.com';
      }

      if (key === 'CORS_ALLOW_CREDENTIALS') {
        return true;
      }

      return undefined;
    });

    const corsOptions = service.corsOptions;
    const successCallback = jest.fn();
    corsOptions.origin('https://dashboard.example.com/', successCallback);
    expect(successCallback).toHaveBeenCalledWith(null, true);

    const noOriginCallback = jest.fn();
    corsOptions.origin(undefined, noOriginCallback);
    expect(noOriginCallback).toHaveBeenCalledWith(null, true);

    const failureCallback = jest.fn();
    corsOptions.origin('https://evil.example.com', failureCallback);
    expect(failureCallback).toHaveBeenCalledWith(expect.any(Error), false);
    expect(corsOptions.credentials).toBe(true);
    expect(corsOptions.allowedHeaders).toEqual([
      'Authorization',
      'Content-Type',
      'X-CSRF-Token',
    ]);
  });

  it('returns default throttle settings when not configured', () => {
    configService.get.mockReturnValue(undefined);

    expect(service.throttleTtlMs).toBe(60000);
    expect(service.throttleLimit).toBe(20);
  });

  it('returns configured throttle settings', () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'THROTTLE_TTL_MS') {
        return 30000;
      }

      if (key === 'THROTTLE_LIMIT') {
        return 10;
      }

      return undefined;
    });

    expect(service.throttleTtlMs).toBe(30000);
    expect(service.throttleLimit).toBe(10);
  });

  it('returns csrfSecret from config when present', () => {
    configService.get.mockReturnValue('csrf-secret');

    expect(service.csrfSecret).toBe('csrf-secret');
    expect(configService.get).toHaveBeenCalledWith('CSRF_SECRET');
  });

  it('falls back to the local default csrf secret when absent', () => {
    configService.get.mockReturnValue(undefined);

    expect(service.csrfSecret).toBe('moduflow-local-csrf-secret');
  });

  it('returns jwtSecret from config when present', () => {
    configService.get.mockReturnValue('jwt-secret');

    expect(service.jwtSecret).toBe('jwt-secret');
    expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
  });

  it('falls back to the local default jwt secret when absent', () => {
    configService.get.mockReturnValue(undefined);

    expect(service.jwtSecret).toBe('moduflow-local-jwt-secret');
  });
});
