import { PrismaService } from '../../src/database/prisma.service';

export async function createOrganization(
  prisma: PrismaService,
  overrides?: Partial<{
    name: string;
    slug: string;
  }>,
) {
  const slug = overrides?.slug ?? `org-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

  return prisma.organization.create({
    data: {
      name: overrides?.name ?? 'Acme',
      slug,
    },
  });
}
