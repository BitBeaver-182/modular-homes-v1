import type {
  GovernanceRole as PrismaGovernanceRole,
  InvitationStatus as PrismaInvitationStatus,
  MembershipStatus as PrismaMembershipStatus,
} from '@prisma/client';
import type {
  GovernanceRole,
  InvitationStatus,
  MembershipStatus,
} from '@moduflow/types';

type Assert<T extends true> = T;

type GovernanceRoleMatchesPrisma = Assert<
  PrismaGovernanceRole extends GovernanceRole ? true : false
>;
type GovernanceRoleMatchesShared = Assert<
  GovernanceRole extends PrismaGovernanceRole ? true : false
>;

type MembershipStatusMatchesPrisma = Assert<
  PrismaMembershipStatus extends MembershipStatus ? true : false
>;
type MembershipStatusMatchesShared = Assert<
  MembershipStatus extends PrismaMembershipStatus ? true : false
>;

type InvitationStatusMatchesPrisma = Assert<
  PrismaInvitationStatus extends InvitationStatus ? true : false
>;
type InvitationStatusMatchesShared = Assert<
  InvitationStatus extends PrismaInvitationStatus ? true : false
>;

export type PrismaEnumAlignment =
  | GovernanceRoleMatchesPrisma
  | GovernanceRoleMatchesShared
  | MembershipStatusMatchesPrisma
  | MembershipStatusMatchesShared
  | InvitationStatusMatchesPrisma
  | InvitationStatusMatchesShared;
