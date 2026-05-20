-- Ensure only one active membership per (user, organization) while allowing re-join after soft delete
CREATE UNIQUE INDEX IF NOT EXISTS "membership_unique_active"
ON "Membership" ("userId", "organizationId")
WHERE "deletedAt" IS NULL;
