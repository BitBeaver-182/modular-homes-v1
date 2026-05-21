import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { BootstrapStrategy } from '../../src/shared/bootstrap/bootstrap-strategies';

type TableRow = {
  table_name: string;
};

export function applyTestMigrations(): void {
  execFileSync('pnpm', ['prisma:deploy'], {
    cwd: resolve(__dirname, '../..'),
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
    stdio: 'inherit',
  });
}

export async function createRealDbTestApp(): Promise<{
  app: INestApplication;
  moduleRef: TestingModule;
  prisma: PrismaService;
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  const bootstrapStrategy = app.get(BootstrapStrategy);

  await bootstrapStrategy.configure(app);
  await app.init();

  return {
    app,
    moduleRef,
    prisma: app.get(PrismaService),
  };
}

export async function truncateTestDatabase(
  prisma: Pick<PrismaService, '$executeRawUnsafe' | '$queryRawUnsafe'>,
): Promise<void> {
  const tables = await prisma.$queryRawUnsafe<TableRow[]>(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = current_schema()
      AND table_type = 'BASE TABLE'
      AND table_name <> '_prisma_migrations'
  `);

  if (tables.length === 0) {
    return;
  }

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tables
      .map(({ table_name }) => quoteIdentifier(table_name))
      .join(', ')} RESTART IDENTITY CASCADE;`,
  );
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}
