export type NodeEnv = 'development' | 'test' | 'production' | 'local';
export type DatabaseType = 'postgresql' | 'mysql' | 'mongodb';

export interface AppEnv {
  NODE_ENV: NodeEnv;
  DATABASE_URL: string;
  DIRECT_URL: string;
  PORT: number;
  JWT_SECRET?: string;
}

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const rawNodeEnv = config.NODE_ENV;

  if (typeof rawNodeEnv !== 'string' || rawNodeEnv.length === 0) {
    throw new Error('NODE_ENV is required');
  }

  if (
    rawNodeEnv !== 'local' &&
    rawNodeEnv !== 'development' &&
    rawNodeEnv !== 'test' &&
    rawNodeEnv !== 'production'
  ) {
    throw new Error(
      'NODE_ENV must be one of: development, test, production, local',
    );
  }

  const databaseUrl = getRequiredString(config.DATABASE_URL, 'DATABASE_URL');
  const directUrl = getRequiredString(config.DIRECT_URL, 'DIRECT_URL');
  const jwtSecret =
    typeof config.JWT_SECRET === 'string' && config.JWT_SECRET.length > 0
      ? config.JWT_SECRET
      : undefined;

  if (rawNodeEnv === 'production' && !jwtSecret) {
    throw new Error('JWT_SECRET is required in production');
  }

  return {
    NODE_ENV: rawNodeEnv,
    DATABASE_URL: databaseUrl,
    DIRECT_URL: directUrl,
    PORT: getOptionalPort(config.PORT),
    JWT_SECRET: jwtSecret,
  };
}

export function resolveMigrationDatabaseUrl(
  config: Record<string, unknown>,
): string {
  return getRequiredString(config.DIRECT_URL, 'DIRECT_URL');
}

function getRequiredString(rawValue: unknown, keyName: string): string {
  if (typeof rawValue === 'string' && rawValue.length > 0) {
    return rawValue;
  }

  throw new Error(`${keyName} is required`);
}

function getOptionalPort(rawValue: unknown): number {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return 3000;
  }

  const port = typeof rawValue === 'number' ? rawValue : Number(rawValue);

  if (Number.isInteger(port) && port >= 1 && port <= 65_535) {
    return port;
  }

  throw new Error('PORT must be an integer between 1 and 65535');
}
