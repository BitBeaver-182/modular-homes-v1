import { validateEnv } from './env.validation';

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
      JWT_SECRET: undefined,
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

  it('throws when DIRECT_URL is missing', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:6543/app',
      }),
    ).toThrow('DIRECT_URL is required');
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

  it('includes JWT_SECRET when provided', () => {
    const result = validateEnv({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:6543/app',
      DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/app',
      JWT_SECRET: 'super-secret',
    });

    expect(result.JWT_SECRET).toBe('super-secret');
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
});
