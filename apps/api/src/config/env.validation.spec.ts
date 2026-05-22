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
});
