/// <reference types="node" />

import { defineConfig, PrismaConfig } from 'prisma/config';
import { loadResolvedEnvFiles } from './src/config/env-files.js';
import { resolveMigrationDatabaseUrl } from './src/config/env.validation.js';

loadResolvedEnvFiles(process.cwd());

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
  },
  datasource: {
    url: resolveMigrationDatabaseUrl(process.env),
  },
}) satisfies PrismaConfig;
