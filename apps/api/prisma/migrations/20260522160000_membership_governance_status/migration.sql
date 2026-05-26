CREATE TYPE "GovernanceRole" AS ENUM ('owner', 'member');
CREATE TYPE "MembershipStatus" AS ENUM ('invited', 'active', 'removed');

ALTER TABLE "OrganizationUser"
ADD COLUMN "governanceRole" "GovernanceRole" NOT NULL DEFAULT 'member',
ADD COLUMN "status" "MembershipStatus" NOT NULL DEFAULT 'active';
