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

  it('throws when DATABASE_URL is missing', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'test',
      }),
    ).toThrow('DATABASE_URL is required');
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
});
