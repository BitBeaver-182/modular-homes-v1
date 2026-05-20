/// <reference types="node" />

import * as fs from 'fs';
import * as path from 'path';
import { defineConfig, PrismaConfig } from 'prisma/config';
import { resolveMigrationDatabaseUrl } from './src/config/env.validation.js';

const configDirectory = process.cwd();

loadEnvFiles();

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
  },
  datasource: {
    url: resolveMigrationDatabaseUrl(process.env),
  },
}) satisfies PrismaConfig;

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