
export type NodeEnv = 'development' | 'test' | 'production';

export interface AppEnv {
  NODE_ENV: NodeEnv;
  DATABASE_URL: string;
}

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const rawNodeEnv = config.NODE_ENV;
  const dbUrl = config.DATABASE_URL;

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

  if (typeof dbUrl !== 'string' || dbUrl.length === 0) {
    throw new Error('DATABASE_URL is required');
  }

  return {
    NODE_ENV: rawNodeEnv,
    DATABASE_URL: dbUrl,
  };
}
