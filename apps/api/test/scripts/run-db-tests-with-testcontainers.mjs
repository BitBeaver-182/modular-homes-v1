import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appDirectory = resolve(__dirname, '../..');

async function main() {
  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('moduflow_test')
    .withUsername('postgres')
    .withPassword('postgres')
    .start();

  const testEnvironment = {
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL: container.getConnectionUri(),
    DIRECT_URL: container.getConnectionUri(),
  };

  try {
    runCommand(['prisma', 'migrate', 'deploy'], testEnvironment);
    runCommand(
      ['jest', '--config', './test/jest-integration-db.json', '--runInBand'],
      testEnvironment,
    );
    runCommand(
      ['jest', '--config', './test/jest-e2e-db.json', '--runInBand'],
      testEnvironment,
    );
  } finally {
    await container.stop();
  }
}

function runCommand(commandArgs, env) {
  execFileSync('pnpm', commandArgs, {
    cwd: appDirectory,
    env,
    stdio: 'inherit',
  });
}

await main();
