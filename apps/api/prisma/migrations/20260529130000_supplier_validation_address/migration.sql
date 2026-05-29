ALTER TABLE "Supplier"
ADD COLUMN "addressFull" TEXT,
ADD COLUMN "addressLine1" TEXT,
ADD COLUMN "addressLine2" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "region" TEXT,
ADD COLUMN "postalCode" TEXT,
ADD COLUMN "countryCode" TEXT;

UPDATE "Supplier"
SET "addressFull" = NULLIF(BTRIM("address"), '')
WHERE "address" IS NOT NULL;

ALTER TABLE "Supplier" DROP COLUMN "address";

CREATE INDEX "Supplier_organizationId_addressFull_idx" ON "Supplier"("organizationId", "addressFull");
CREATE INDEX "Supplier_organizationId_city_idx" ON "Supplier"("organizationId", "city");
CREATE INDEX "Supplier_organizationId_countryCode_idx" ON "Supplier"("organizationId", "countryCode");

CREATE UNIQUE INDEX "Supplier_organizationId_name_active_unique"
ON "Supplier" ("organizationId", LOWER("name"))
WHERE "deletedAt" IS NULL;
