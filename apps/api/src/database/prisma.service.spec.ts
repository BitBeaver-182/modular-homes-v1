import { PrismaService } from './prisma.service';

const mockPrismaPg = jest.fn();
const mockPool = jest.fn();
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockLoggerLog = jest.fn();
const mockPoolInstance = { __pool: true };

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: function PrismaPgMock(options: unknown) {
    mockPrismaPg(options);
    return { __adapter: true };
  },
}));

jest.mock('pg', () => ({
  Pool: function PoolMock(options: unknown) {
    mockPool(options);
    return mockPoolInstance;
  },
}));

jest.mock('@prisma/client', () => ({
  PrismaClient: class PrismaClientMock {
    constructor() {}
    $connect = mockConnect;
    $disconnect = mockDisconnect;
  },
}));

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

describe('PrismaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when DATABASE_URL is missing', () => {
    const config = { databaseUrl: '' };

    expect(() => new PrismaService(config as never)).toThrow(
      'DATABASE_URL is required to initialize PrismaService',
    );
  });

  it('initializes adapter with configured database URL', () => {
    const config = { databaseUrl: 'postgresql://user:pass@localhost:5432/app' };

    void new PrismaService(config as never);

    expect(mockPool).toHaveBeenCalledWith({
      connectionString: config.databaseUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    expect(mockPrismaPg).toHaveBeenCalledWith(mockPoolInstance);
  });

  it('connects and logs on module init', async () => {
    const service = new PrismaService({
      databaseUrl: 'postgresql://user:pass@localhost:5432/app',
    } as never);

    await service.onModuleInit();

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockLoggerLog).toHaveBeenCalledWith(
      'Database connection established',
    );
  });

  it('disconnects and logs on module destroy', async () => {
    const service = new PrismaService({
      databaseUrl: 'postgresql://user:pass@localhost:5432/app',
    } as never);

    await service.onModuleDestroy();

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(mockLoggerLog).toHaveBeenCalledWith('Database connection closed');
  });
});
