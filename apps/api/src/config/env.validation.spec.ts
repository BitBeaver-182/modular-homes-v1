import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('returns normalized values for valid input', () => {
    const result = validateEnv({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/postgres',
    });

    expect(result).toEqual({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/postgres',
    });
  });

  it('throws when DATABASE_URL and db parts are missing', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'test',
      }),
    ).toThrow('DATABASE_TYPE must be one of: postgresql, mysql, mongodb');
  });

  it('throws when NODE_ENV is missing', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/postgres',
      }),
    ).toThrow('NODE_ENV is required');
  });

  it('throws when NODE_ENV is invalid', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'staging',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/postgres',
      }),
    ).toThrow('NODE_ENV must be one of: development, test, production');
  });

  it('accepts db connection parts when DATABASE_URL is not provided', () => {
    const result = validateEnv({
      NODE_ENV: 'test',
      DATABASE_TYPE: 'postgresql',
      DATABASE_HOST: '127.0.0.1',
      DATABASE_PORT: '5432',
      DATABASE_NAME: 'moduflow',
      DATABASE_USER: 'postgres',
      DATABASE_PASSWORD: 'postgres',
    });

    expect(result).toEqual({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:5432/moduflow',
    });
  });

  it('throws when DATABASE_PASSWORD is missing while using db parts', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'test',
        DATABASE_TYPE: 'postgresql',
        DATABASE_HOST: '127.0.0.1',
        DATABASE_PORT: '5432',
        DATABASE_NAME: 'moduflow',
        DATABASE_USER: 'postgres',
      }),
    ).toThrow('DATABASE_PASSWORD is required');
  });

  it('throws when DATABASE_TYPE is invalid', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'test',
        DATABASE_TYPE: 'sqlite',
      }),
    ).toThrow('DATABASE_TYPE must be one of: postgresql, mysql, mongodb');
  });
});
