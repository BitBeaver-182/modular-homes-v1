ALTER TABLE "SupplierQuote"
ADD COLUMN IF NOT EXISTS "statusUpdatedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "statusUpdatedByUserId" BIGINT;

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
