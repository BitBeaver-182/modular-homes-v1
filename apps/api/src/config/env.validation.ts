export type NodeEnv = 'development' | 'test' | 'production';
export type DatabaseType = 'postgresql' | 'mysql' | 'mongodb';

export interface AppEnv {
  NODE_ENV: NodeEnv;
  DATABASE_URL: string;
}

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const rawNodeEnv = config.NODE_ENV;

  if (typeof rawNodeEnv !== 'string' || rawNodeEnv.length === 0) {
    throw new Error('NODE_ENV is required');
  }

  if (
    rawNodeEnv !== 'development' &&
    rawNodeEnv !== 'test' &&
    rawNodeEnv !== 'production'
  ) {
    throw new Error('NODE_ENV must be one of: development, test, production');
  }

  const resolvedDatabaseUrl = buildDatabaseUrlFromParts(config);

  return {
    NODE_ENV: rawNodeEnv,
    DATABASE_URL: resolvedDatabaseUrl,
  };
}

export function buildDatabaseUrlFromParts(
  config: Record<string, unknown>,
): string {
  const type = getRequiredString(config.DATABASE_TYPE, 'DATABASE_TYPE');
  const user = getRequiredString(config.DATABASE_USER, 'DATABASE_USER');
  const password = getRequiredString(
    config.DATABASE_PASSWORD,
    'DATABASE_PASSWORD',
  );
  const host = getRequiredString(config.DATABASE_HOST, 'DATABASE_HOST');
  const database = getRequiredString(config.DATABASE_NAME, 'DATABASE_NAME');
  const port = getRequiredString(config.DATABASE_PORT, 'DATABASE_PORT');
  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);

  return `${type}://${encodedUser}:${encodedPassword}@${host}:${port}/${database}`;
}

function getRequiredString(rawValue: unknown, keyName: string): string {
  if (typeof rawValue === 'string' && rawValue.length > 0) {
    return rawValue;
  }

  throw new Error(`${keyName} is required`);
}
