CREATE TABLE IF NOT EXISTS "Address" (
    "id" BIGSERIAL NOT NULL,
    "organizationId" BIGINT NOT NULL,
    "line1" TEXT,
    "line2" TEXT,
    "city" TEXT,
    "region" TEXT,
    "postalCode" TEXT,
    "countryCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Address_organizationId_idx" ON "Address"("organizationId");
CREATE INDEX IF NOT EXISTS "Address_deletedAt_idx" ON "Address"("deletedAt");
CREATE INDEX IF NOT EXISTS "Address_organizationId_deletedAt_idx" ON "Address"("organizationId", "deletedAt");
CREATE INDEX IF NOT EXISTS "Address_organizationId_city_idx" ON "Address"("organizationId", "city");
CREATE INDEX IF NOT EXISTS "Address_organizationId_countryCode_idx" ON "Address"("organizationId", "countryCode");
CREATE UNIQUE INDEX IF NOT EXISTS "Address_id_organizationId_key" ON "Address"("id", "organizationId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Address_organizationId_fkey'
  ) THEN
    ALTER TABLE "Address" ADD CONSTRAINT "Address_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "addressId" BIGINT;
CREATE INDEX IF NOT EXISTS "Supplier_addressId_idx" ON "Supplier"("addressId");
ALTER TABLE "Supplier" DROP CONSTRAINT IF EXISTS "Supplier_addressId_fkey";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Supplier_addressId_organizationId_fkey'
  ) THEN
    ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_addressId_organizationId_fkey"
    FOREIGN KEY ("addressId", "organizationId") REFERENCES "Address"("id", "organizationId") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'Supplier'
      AND column_name = 'addressFull'
  ) THEN
    ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "_supplierMigrationId" BIGINT;

    WITH address_source AS (
      SELECT
        id AS "supplierId",
        "organizationId",
        NULLIF(BTRIM("addressLine1"), '') AS "line1",
        NULLIF(BTRIM("addressLine2"), '') AS "line2",
        NULLIF(BTRIM("city"), '') AS "city",
        NULLIF(BTRIM("region"), '') AS "region",
        NULLIF(BTRIM("postalCode"), '') AS "postalCode",
        UPPER(NULLIF(BTRIM("countryCode"), '')) AS "countryCode",
        NULLIF(BTRIM("addressFull"), '') AS "legacyFullAddress"
      FROM "Supplier"
      WHERE "addressId" IS NULL
        AND (
          NULLIF(BTRIM("addressFull"), '') IS NOT NULL
          OR NULLIF(BTRIM("addressLine1"), '') IS NOT NULL
          OR NULLIF(BTRIM("addressLine2"), '') IS NOT NULL
          OR NULLIF(BTRIM("city"), '') IS NOT NULL
          OR NULLIF(BTRIM("region"), '') IS NOT NULL
          OR NULLIF(BTRIM("postalCode"), '') IS NOT NULL
          OR NULLIF(BTRIM("countryCode"), '') IS NOT NULL
        )
    ),
    created_addresses AS (
      INSERT INTO "Address" (
        "organizationId",
        "line1",
        "line2",
        "city",
        "region",
        "postalCode",
        "countryCode",
        "_supplierMigrationId",
        "createdAt",
        "updatedAt"
      )
      SELECT
        "organizationId",
        COALESCE("line1", "legacyFullAddress"),
        "line2",
        "city",
        "region",
        "postalCode",
        "countryCode",
        "supplierId",
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM address_source
      RETURNING id, "_supplierMigrationId"
    )
    UPDATE "Supplier"
    SET "addressId" = created_addresses.id
    FROM created_addresses
    WHERE "Supplier".id = created_addresses."_supplierMigrationId";

    ALTER TABLE "Address" DROP COLUMN IF EXISTS "_supplierMigrationId";
  END IF;
END $$;

ALTER TABLE "Address" DROP COLUMN IF EXISTS "_supplierMigrationId";

DROP INDEX IF EXISTS "Supplier_organizationId_addressFull_idx";
DROP INDEX IF EXISTS "Supplier_organizationId_city_idx";
DROP INDEX IF EXISTS "Supplier_organizationId_countryCode_idx";

ALTER TABLE "Supplier" DROP COLUMN IF EXISTS "addressFull";
ALTER TABLE "Supplier" DROP COLUMN IF EXISTS "addressLine1";
ALTER TABLE "Supplier" DROP COLUMN IF EXISTS "addressLine2";
ALTER TABLE "Supplier" DROP COLUMN IF EXISTS "city";
ALTER TABLE "Supplier" DROP COLUMN IF EXISTS "region";
ALTER TABLE "Supplier" DROP COLUMN IF EXISTS "postalCode";
ALTER TABLE "Supplier" DROP COLUMN IF EXISTS "countryCode";
