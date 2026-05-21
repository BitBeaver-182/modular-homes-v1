import * as fs from 'fs';
import * as path from 'path';

const ENV_FILE_NAME = '.env';
const NODE_ENV_KEY = 'NODE_ENV';

export function resolveEnvFilePaths(
  configDirectory: string,
  runtimeNodeEnv = process.env.NODE_ENV,
): string[] {
  const nodeEnv = runtimeNodeEnv ?? readNodeEnvFromBaseEnvFile(configDirectory);

  return [
    path.join(configDirectory, ENV_FILE_NAME),
    nodeEnv ? path.join(configDirectory, `${ENV_FILE_NAME}.${nodeEnv}`) : null,
    path.join(configDirectory, `${ENV_FILE_NAME}.local`),
    nodeEnv
      ? path.join(configDirectory, `${ENV_FILE_NAME}.${nodeEnv}.local`)
      : null,
  ].filter((value): value is string => value !== null);
}

export function loadResolvedEnvFiles(
  configDirectory: string,
  runtimeNodeEnv = process.env.NODE_ENV,
): void {
  for (const absolutePath of resolveEnvFilePaths(
    configDirectory,
    runtimeNodeEnv,
  )) {
    if (!fs.existsSync(absolutePath)) {
      continue;
    }

    process.loadEnvFile(absolutePath);
  }
}

function readNodeEnvFromBaseEnvFile(
  configDirectory: string,
): string | undefined {
  const envFilePath = path.join(configDirectory, ENV_FILE_NAME);

  if (!fs.existsSync(envFilePath)) {
    return undefined;
  }

  const envFileContents = fs.readFileSync(envFilePath, 'utf8');

  for (const rawLine of envFileContents.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (line.length === 0 || line.startsWith('#')) {
      continue;
    }

    const [rawKey, ...rawValueParts] = line.split('=');
    if (rawKey?.trim() !== NODE_ENV_KEY) {
      continue;
    }

    const rawValue = rawValueParts.join('=').trim();
    return stripWrappingQuotes(rawValue);
  }

  return undefined;
}

function stripWrappingQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
