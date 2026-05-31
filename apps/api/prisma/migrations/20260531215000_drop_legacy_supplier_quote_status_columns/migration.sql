ALTER TABLE "SupplierQuote"
DROP COLUMN IF EXISTS "acceptedAt",
DROP COLUMN IF EXISTS "rejectedAt",
DROP COLUMN IF EXISTS "acceptedByUserId";
