import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('returns normalized values for valid input', () => {
    const result = validateEnv({
      NODE_ENV: 'test',
      DATABASE_TYPE: "postgresql",
      DATABASE_USER: "username",
      DATABASE_PASSWORD: "password",
      DATABASE_HOST: "locohost",
      DATABASE_PORT: "5434",
      DATABASE_NAME: "testdb"
    });

    expect(result).toEqual({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://username:password@locohost:5434/testdb',
    });
  });


  it('throws when NODE_ENV is missing', () => {
    expect(() =>
      validateEnv({
        DATABASE_TYPE: "postgresql",
        DATABASE_USER: "username",
        DATABASE_PASSWORD: "password",
        DATABASE_HOST: "locohost",
        DATABASE_PORT: "5434",
        DATABASE_NAME: "testdb"
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

  it('throws when any required db part is missing while DATABASE_URL is absent', () => {
    const baseConfig = {
      NODE_ENV: 'test' as const,
      DATABASE_TYPE: 'postgresql',
      DATABASE_HOST: '127.0.0.1',
      DATABASE_PORT: '5432',
      DATABASE_NAME: 'moduflow',
      DATABASE_USER: 'postgres',
      DATABASE_PASSWORD: 'postgres',
    };

    const cases: Array<[keyof typeof baseConfig, string]> = [
      ['DATABASE_TYPE', 'DATABASE_TYPE is required'],
      ['DATABASE_USER', 'DATABASE_USER is required'],
      ['DATABASE_PASSWORD', 'DATABASE_PASSWORD is required'],
      ['DATABASE_HOST', 'DATABASE_HOST is required'],
      ['DATABASE_NAME', 'DATABASE_NAME is required'],
      ['DATABASE_PORT', 'DATABASE_PORT is required'],
    ];

    for (const [key, expectedMessage] of cases) {
      const { [key]: _, ...partialConfig } = baseConfig;
      expect(() => validateEnv(partialConfig)).toThrow(expectedMessage);
    }
  });

  it('throws when DATABASE_TYPE is missing', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'test',
      }),
    ).toThrow('DATABASE_TYPE is required');
  });
});
