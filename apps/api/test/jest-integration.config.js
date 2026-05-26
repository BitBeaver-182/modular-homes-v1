const DEFAULT_DB_SUITE_TIMEOUT_MS = 15000;

const parsedTimeout = Number.parseInt(process.env.TEST_TIMEOUT_MS ?? '', 10);

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/integration/**/*.spec.ts'],
  testTimeout:
    Number.isFinite(parsedTimeout) && parsedTimeout > 0
      ? parsedTimeout
      : DEFAULT_DB_SUITE_TIMEOUT_MS,
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
};
