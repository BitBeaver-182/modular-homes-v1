ALTER TABLE "SupplierQuote"
ADD COLUMN IF NOT EXISTS "statusUpdatedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "statusUpdatedByUserId" BIGINT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'SupplierQuote'
      AND column_name = 'acceptedAt'
  ) THEN
    EXECUTE '
      UPDATE "SupplierQuote"
      SET
        "statusUpdatedAt" = COALESCE("acceptedAt", "rejectedAt"),
        "statusUpdatedByUserId" = "acceptedByUserId"
      WHERE
        "statusUpdatedAt" IS NULL
        AND (
          "acceptedAt" IS NOT NULL
          OR "rejectedAt" IS NOT NULL
          OR "acceptedByUserId" IS NOT NULL
        )
    ';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'SupplierQuote_statusUpdatedByUserId_fkey'
  ) THEN
    ALTER TABLE "SupplierQuote"
    ADD CONSTRAINT "SupplierQuote_statusUpdatedByUserId_fkey"
    FOREIGN KEY ("statusUpdatedByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
