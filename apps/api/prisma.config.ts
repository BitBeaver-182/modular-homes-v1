import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'prisma/config';
import { buildDatabaseUrlFromParts } from './src/config/env.validation.js';

const configDirectory = import.meta.dirname;

loadEnvFiles();

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
  },
  datasource: {
    url: resolveDatabaseUrl(),
  },
});

function loadEnvFiles(): void {
  const nodeEnv = process.env.NODE_ENV;
  const candidateFileNames = [
    '.env',
    nodeEnv ? `.env.${nodeEnv}` : undefined,
    '.env.local',
    nodeEnv ? `.env.${nodeEnv}.local` : undefined,
  ];

  for (const fileName of candidateFileNames) {
    if (!fileName) {
      continue;
    }

    const absolutePath = path.join(configDirectory, fileName);

    if (!fs.existsSync(absolutePath)) {
      continue;
    }

    process.loadEnvFile(absolutePath);
  }
}

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  return buildDatabaseUrlFromParts(process.env);
}
