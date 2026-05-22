import * as path from 'path';
import * as fs from 'fs';
import { loadResolvedEnvFiles, resolveEnvFilePaths } from './env-files';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

describe('env-files', () => {
  const configDirectory = '/tmp/moduflow-config';
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('resolveEnvFilePaths', () => {
    it('prefers the runtime NODE_ENV when provided', () => {
      expect(resolveEnvFilePaths(configDirectory, 'test')).toEqual([
        path.join(configDirectory, '.env.test'),
        path.join(configDirectory, '.env'),
      ]);
    });

    it('reads NODE_ENV from the base env file when runtime NODE_ENV is absent', () => {
      delete process.env.NODE_ENV;
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest
        .spyOn(fs, 'readFileSync')
        .mockReturnValue("OTHER_KEY=value\nNODE_ENV='local'\n");

      expect(resolveEnvFilePaths(configDirectory, undefined)).toEqual([
        path.join(configDirectory, '.env.local'),
        path.join(configDirectory, '.env'),
      ]);
    });

    it('returns only the base env path when no NODE_ENV can be resolved', () => {
      delete process.env.NODE_ENV;
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      expect(resolveEnvFilePaths(configDirectory, undefined)).toEqual([
        path.join(configDirectory, '.env'),
      ]);
    });

    it('ignores comments and blank lines when reading the base env file', () => {
      delete process.env.NODE_ENV;
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest
        .spyOn(fs, 'readFileSync')
        .mockReturnValue('\n# comment\nNODE_ENV="development"\n');

      expect(resolveEnvFilePaths(configDirectory, undefined)).toEqual([
        path.join(configDirectory, '.env.development'),
        path.join(configDirectory, '.env'),
      ]);
    });

    it('preserves unquoted values containing equals signs', () => {
      delete process.env.NODE_ENV;
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('NODE_ENV=prod=like\n');

      expect(resolveEnvFilePaths(configDirectory, undefined)).toEqual([
        path.join(configDirectory, '.env.prod=like'),
        path.join(configDirectory, '.env'),
      ]);
    });
  });

  describe('loadResolvedEnvFiles', () => {
    it('loads only existing env files', () => {
      const existsSyncSpy = jest
        .spyOn(fs, 'existsSync')
        .mockImplementation(
          (filePath) =>
            String(filePath).endsWith('.env.test') ||
            String(filePath).endsWith('.env'),
        );
      const loadEnvFileSpy = jest
        .spyOn(process, 'loadEnvFile')
        .mockImplementation(() => {});

      loadResolvedEnvFiles(configDirectory, 'test');

      expect(existsSyncSpy).toHaveBeenCalled();
      expect(loadEnvFileSpy).toHaveBeenCalledTimes(2);
      expect(loadEnvFileSpy).toHaveBeenNthCalledWith(
        1,
        path.join(configDirectory, '.env.test'),
      );
      expect(loadEnvFileSpy).toHaveBeenNthCalledWith(
        2,
        path.join(configDirectory, '.env'),
      );
    });

    it('skips files that do not exist', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      const loadEnvFileSpy = jest
        .spyOn(process, 'loadEnvFile')
        .mockImplementation(() => {});

      loadResolvedEnvFiles(configDirectory, 'production');

      expect(loadEnvFileSpy).not.toHaveBeenCalled();
    });
  });
});
