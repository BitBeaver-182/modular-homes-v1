ALTER TABLE "Supplier"
ADD COLUMN IF NOT EXISTS "addressFull" TEXT,
ADD COLUMN IF NOT EXISTS "addressLine1" TEXT,
ADD COLUMN IF NOT EXISTS "addressLine2" TEXT,
ADD COLUMN IF NOT EXISTS "city" TEXT,
ADD COLUMN IF NOT EXISTS "region" TEXT,
ADD COLUMN IF NOT EXISTS "postalCode" TEXT,
ADD COLUMN IF NOT EXISTS "countryCode" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'Supplier'
      AND column_name = 'address'
  ) THEN
    UPDATE "Supplier"
    SET "addressFull" = NULLIF(BTRIM("address"), '')
    WHERE "address" IS NOT NULL
      AND "addressFull" IS NULL;
  END IF;
END $$;

ALTER TABLE "Supplier" DROP COLUMN IF EXISTS "address";

CREATE INDEX IF NOT EXISTS "Supplier_organizationId_addressFull_idx" ON "Supplier"("organizationId", "addressFull");
CREATE INDEX IF NOT EXISTS "Supplier_organizationId_city_idx" ON "Supplier"("organizationId", "city");
CREATE INDEX IF NOT EXISTS "Supplier_organizationId_countryCode_idx" ON "Supplier"("organizationId", "countryCode");

DO $$
DECLARE duplicate_count BIGINT;
BEGIN
  SELECT COUNT(*)
  INTO duplicate_count
  FROM (
    SELECT 1
    FROM "Supplier"
    WHERE "deletedAt" IS NULL
    GROUP BY "organizationId", LOWER("name")
    HAVING COUNT(*) > 1
  ) AS duplicate_groups;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION USING
      MESSAGE = 'Cannot enforce supplier name uniqueness while duplicate active suppliers exist',
      DETAIL = 'Resolve duplicate supplier names within each organization before applying this migration.',
      HINT = 'Inspect active suppliers grouped by organizationId and LOWER(name).';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "Supplier_organizationId_name_active_unique"
ON "Supplier" ("organizationId", LOWER("name"))
WHERE "deletedAt" IS NULL;
