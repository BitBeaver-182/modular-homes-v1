import { ConfigService } from '@nestjs/config';
import { AppConfigService } from './app-config.service';

describe('AppConfigService', () => {
  const configService = {
    getOrThrow: jest.fn(),
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
});
