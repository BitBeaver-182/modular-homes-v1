import type { GovernanceRole as PrismaGovernanceRole } from '@prisma/client';
import type { GovernanceRole } from '@moduflow/types';

type Assert<T extends true> = T;

type GovernanceRoleMatchesPrisma = Assert<
  PrismaGovernanceRole extends GovernanceRole ? true : false
>;

export type PrismaEnumAlignment = GovernanceRoleMatchesPrisma;
