ALTER TABLE "Membership" RENAME TO "OrganizationUser";

ALTER TABLE "OrganizationUser" DROP CONSTRAINT "Membership_pkey";
ALTER TABLE "OrganizationUser" ADD CONSTRAINT "OrganizationUser_pkey" PRIMARY KEY ("id");

ALTER INDEX "Membership_userId_idx" RENAME TO "OrganizationUser_userId_idx";
ALTER INDEX "Membership_organizationId_idx" RENAME TO "OrganizationUser_organizationId_idx";
ALTER INDEX "Membership_deletedAt_idx" RENAME TO "OrganizationUser_deletedAt_idx";
ALTER INDEX "membership_unique_active" RENAME TO "OrganizationUser_userId_organizationId_active_key";

ALTER TABLE "OrganizationUser" RENAME CONSTRAINT "Membership_userId_fkey" TO "OrganizationUser_userId_fkey";
ALTER TABLE "OrganizationUser" RENAME CONSTRAINT "Membership_organizationId_fkey" TO "OrganizationUser_organizationId_fkey";

DROP INDEX "OrganizationUser_userId_organizationId_active_key";
ALTER TABLE "OrganizationUser" DROP COLUMN "role";
DROP TYPE "MembershipRole";

CREATE UNIQUE INDEX "OrganizationUser_userId_organizationId_key"
ON "OrganizationUser" ("userId", "organizationId");

CREATE TABLE "Role" (
    "id" BIGSERIAL NOT NULL,
    "organizationId" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Permission" (
    "id" BIGSERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserRole" (
    "id" BIGSERIAL NOT NULL,
    "organizationUserId" BIGINT NOT NULL,
    "roleId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RolePermission" (
    "id" BIGSERIAL NOT NULL,
    "roleId" BIGINT NOT NULL,
    "permissionId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Role_organizationId_idx" ON "Role"("organizationId");
CREATE UNIQUE INDEX "Role_organizationId_name_key" ON "Role"("organizationId", "name");
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");
CREATE INDEX "UserRole_organizationUserId_idx" ON "UserRole"("organizationUserId");
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");
CREATE UNIQUE INDEX "UserRole_organizationUserId_roleId_key" ON "UserRole"("organizationUserId", "roleId");
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

ALTER TABLE "Role" ADD CONSTRAINT "Role_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_organizationUserId_fkey"
FOREIGN KEY ("organizationUserId") REFERENCES "OrganizationUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey"
FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey"
FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey"
FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
