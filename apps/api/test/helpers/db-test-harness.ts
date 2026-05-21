import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { BootstrapStrategy } from '../../src/shared/bootstrap/bootstrap-strategies';

const TEST_TABLES = ['"Membership"', '"Organization"', '"User"'] as const;

export async function applyTestMigrations(): Promise<void> {
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
  prisma: Pick<PrismaService, '$executeRawUnsafe'>,
): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${TEST_TABLES.join(', ')} RESTART IDENTITY CASCADE;`,
  );
}
