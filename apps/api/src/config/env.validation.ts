export type NodeEnv = 'development' | 'test' | 'production' | 'local';
export type DatabaseType = 'postgresql' | 'mysql' | 'mongodb';

export interface AppEnv {
  NODE_ENV: NodeEnv;
  DATABASE_URL: string;
  DIRECT_URL: string;
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

  return {
    NODE_ENV: rawNodeEnv,
    DATABASE_URL: databaseUrl,
    DIRECT_URL: directUrl,
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
