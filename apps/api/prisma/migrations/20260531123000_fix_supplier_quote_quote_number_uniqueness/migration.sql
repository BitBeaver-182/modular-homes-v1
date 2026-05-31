DROP INDEX IF EXISTS "SupplierQuote_organizationId_quoteNumber_key";

CREATE UNIQUE INDEX "SupplierQuote_organizationId_quoteNumber_active_key"
ON "SupplierQuote" ("organizationId", LOWER("quoteNumber"))
WHERE "deletedAt" IS NULL AND "quoteNumber" IS NOT NULL;
