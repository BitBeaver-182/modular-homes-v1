CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Supplier_name_trgm_active_idx"
ON "Supplier" USING GIN ("name" gin_trgm_ops)
WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "Supplier_email_trgm_active_idx"
ON "Supplier" USING GIN ("email" gin_trgm_ops)
WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "Supplier_phoneNumber_trgm_active_idx"
ON "Supplier" USING GIN ("phoneNumber" gin_trgm_ops)
WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "Supplier_website_trgm_active_idx"
ON "Supplier" USING GIN ("website" gin_trgm_ops)
WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "Address_line1_trgm_active_idx"
ON "Address" USING GIN ("line1" gin_trgm_ops)
WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "Address_line2_trgm_active_idx"
ON "Address" USING GIN ("line2" gin_trgm_ops)
WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "Address_city_trgm_active_idx"
ON "Address" USING GIN ("city" gin_trgm_ops)
WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "Address_region_trgm_active_idx"
ON "Address" USING GIN ("region" gin_trgm_ops)
WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "Address_postalCode_trgm_active_idx"
ON "Address" USING GIN ("postalCode" gin_trgm_ops)
WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "Address_countryCode_trgm_active_idx"
ON "Address" USING GIN ("countryCode" gin_trgm_ops)
WHERE "deletedAt" IS NULL;
