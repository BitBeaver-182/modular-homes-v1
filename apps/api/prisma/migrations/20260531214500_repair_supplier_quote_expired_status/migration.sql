UPDATE "SupplierQuote"
SET "status" = 'received'
WHERE "status"::text = 'expired';
