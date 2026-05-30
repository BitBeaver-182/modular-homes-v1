import { resolveMigrationDatabaseUrl, validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('returns normalized values for valid input', () => {
    const databaseUrl =
      'postgresql://postgres.ref:password@somehost:6543/postgres';
    const directUrl =
      'postgresql://postgres.ref:password@somehost:5432/postgres';

    const result = validateEnv({
      NODE_ENV: 'test',
      DATABASE_URL: databaseUrl,
      DIRECT_URL: directUrl,
    });

    expect(result).toEqual({
      NODE_ENV: 'test',
      DATABASE_URL: databaseUrl,
      DIRECT_URL: directUrl,
      PORT: 3000,
      CORS_ORIGINS: undefined,
      CORS_ALLOW_CREDENTIALS: undefined,
      THROTTLE_TTL_MS: undefined,
      THROTTLE_LIMIT: undefined,
      JWT_SECRET: undefined,
      SUPABASE_URL: undefined,
      SUPABASE_SERVICE_ROLE_KEY: undefined,
    });
  });

  it('throws when NODE_ENV is missing', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:6543/app',
        DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/app',
      }),
    ).toThrow('NODE_ENV is required');
  });

  it('throws when NODE_ENV is invalid', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'staging',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/postgres',
      }),
    ).toThrow('NODE_ENV must be one of: development, test, production, local');
  });

  it('throws when DATABASE_URL is missing', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'test',
        DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/app',
      }),
    ).toThrow('DATABASE_URL is required');
  });

  it('falls back to DATABASE_URL when DIRECT_URL is missing', () => {
    const databaseUrl = 'postgresql://postgres:postgres@localhost:6543/app';

    const result = validateEnv({
      NODE_ENV: 'test',
      DATABASE_URL: databaseUrl,
    });

    expect(result.DIRECT_URL).toBe(databaseUrl);
  });

  it('requires JWT_SECRET in production', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:6543/app',
        DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/app',
      }),
    ).toThrow('JWT_SECRET is required in production');
  });

  it('requires Supabase credentials in production', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:6543/app',
        DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/app',
        JWT_SECRET: 'super-secret',
      }),
    ).toThrow('SUPABASE_URL is required in production');

    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:6543/app',
        DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/app',
        JWT_SECRET: 'super-secret',
        SUPABASE_URL: 'https://project.supabase.co',
      }),
    ).toThrow('SUPABASE_SERVICE_ROLE_KEY is required in production');
  });

  it('includes JWT_SECRET when provided', () => {
    const result = validateEnv({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:6543/app',
      DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/app',
      JWT_SECRET: 'super-secret',
    });

    expect(result.JWT_SECRET).toBe('super-secret');
  });

  it('includes Supabase credentials when provided', () => {
    const result = validateEnv({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:6543/app',
      DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/app',
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    });

    expect(result.SUPABASE_URL).toBe('https://project.supabase.co');
    expect(result.SUPABASE_SERVICE_ROLE_KEY).toBe('service-role-key');
  });

  it('uses PORT when provided', () => {
    const result = validateEnv({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:6543/app',
      DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/app',
      PORT: '3001',
    });

    expect(result.PORT).toBe(3001);
  });

  it('includes cors env values when provided', () => {
    const result = validateEnv({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:6543/app',
      DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/app',
      CORS_ORIGINS: 'https://dashboard.example.com, https://admin.example.com',
      CORS_ALLOW_CREDENTIALS: 'false',
    });

    expect(result.CORS_ORIGINS).toBe(
      'https://dashboard.example.com, https://admin.example.com',
    );
    expect(result.CORS_ALLOW_CREDENTIALS).toBe(false);
  });

  it('includes throttle env values when provided', () => {
    const result = validateEnv({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:6543/app',
      DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/app',
      THROTTLE_TTL_MS: '30000',
      THROTTLE_LIMIT: '10',
    });

    expect(result.THROTTLE_TTL_MS).toBe(30000);
    expect(result.THROTTLE_LIMIT).toBe(10);
  });

  it('throws when PORT is invalid', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:6543/app',
        DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/app',
        PORT: 'abc',
      }),
    ).toThrow('PORT must be an integer between 1 and 65535');
  });

  it('throws when CORS_ALLOW_CREDENTIALS is invalid', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:6543/app',
        DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/app',
        CORS_ALLOW_CREDENTIALS: 'yes',
      }),
    ).toThrow('CORS_ALLOW_CREDENTIALS must be true or false');
  });

  it('throws when throttle env values are invalid', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:6543/app',
        DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/app',
        THROTTLE_TTL_MS: '0',
      }),
    ).toThrow('THROTTLE_TTL_MS must be a positive integer');

    expect(() =>
      validateEnv({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:6543/app',
        DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/app',
        THROTTLE_LIMIT: '-1',
      }),
    ).toThrow('THROTTLE_LIMIT must be a positive integer');
  });

  it('uses DIRECT_URL for migrations when provided', () => {
    expect(
      resolveMigrationDatabaseUrl({
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:6543/app',
        DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/app',
      }),
    ).toBe('postgresql://postgres:postgres@localhost:5432/app');
  });

  it('falls back to DATABASE_URL for migrations when DIRECT_URL is missing', () => {
    expect(
      resolveMigrationDatabaseUrl({
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:6543/app',
      }),
    ).toBe('postgresql://postgres:postgres@localhost:6543/app');
  });
});
