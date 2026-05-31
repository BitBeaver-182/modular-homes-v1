CREATE TYPE "SupplierQuoteStatus" AS ENUM ('received', 'accepted', 'rejected');

CREATE TABLE "SupplierQuote" (
    "id" BIGSERIAL NOT NULL,
    "organizationId" BIGINT NOT NULL,
    "supplierId" BIGINT NOT NULL,
    "attachmentId" TEXT,
    "quoteNumber" TEXT,
    "status" "SupplierQuoteStatus" NOT NULL DEFAULT 'received',
    "quoteDate" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "currencyCode" CHAR(3) NOT NULL DEFAULT 'USD',
    "subtotalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "shippingAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "statusUpdatedAt" TIMESTAMP(3),
    "statusUpdatedByUserId" BIGINT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierQuote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupplierQuoteLine" (
    "id" BIGSERIAL NOT NULL,
    "organizationId" BIGINT NOT NULL,
    "supplierQuoteId" BIGINT NOT NULL,
    "houseModelId" BIGINT,
    "productConfigurationId" BIGINT,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "estimatedProductionDays" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierQuoteLine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SupplierQuote_attachmentId_key" ON "SupplierQuote"("attachmentId");
CREATE UNIQUE INDEX "SupplierQuote_organizationId_id_key" ON "SupplierQuote"("organizationId", "id");
CREATE UNIQUE INDEX "SupplierQuote_organizationId_quoteNumber_key" ON "SupplierQuote"("organizationId", "quoteNumber");
CREATE INDEX "SupplierQuote_organizationId_idx" ON "SupplierQuote"("organizationId");
CREATE INDEX "SupplierQuote_organizationId_deletedAt_idx" ON "SupplierQuote"("organizationId", "deletedAt");
CREATE INDEX "SupplierQuote_organizationId_createdAt_idx" ON "SupplierQuote"("organizationId", "createdAt");
CREATE INDEX "SupplierQuote_organizationId_status_quoteDate_idx" ON "SupplierQuote"("organizationId", "status", "quoteDate");
CREATE INDEX "SupplierQuote_organizationId_supplierId_idx" ON "SupplierQuote"("organizationId", "supplierId");
CREATE INDEX "SupplierQuote_organizationId_totalAmount_idx" ON "SupplierQuote"("organizationId", "totalAmount");
CREATE INDEX "SupplierQuote_quoteDate_idx" ON "SupplierQuote"("quoteDate");
CREATE INDEX "SupplierQuote_validUntil_idx" ON "SupplierQuote"("validUntil");

CREATE UNIQUE INDEX "SupplierQuoteLine_organizationId_id_key" ON "SupplierQuoteLine"("organizationId", "id");
CREATE INDEX "SupplierQuoteLine_organizationId_idx" ON "SupplierQuoteLine"("organizationId");
CREATE INDEX "SupplierQuoteLine_organizationId_supplierQuoteId_idx" ON "SupplierQuoteLine"("organizationId", "supplierQuoteId");
CREATE INDEX "SupplierQuoteLine_houseModelId_idx" ON "SupplierQuoteLine"("houseModelId");
CREATE INDEX "SupplierQuoteLine_productConfigurationId_idx" ON "SupplierQuoteLine"("productConfigurationId");
CREATE INDEX "SupplierQuoteLine_supplierQuoteId_idx" ON "SupplierQuoteLine"("supplierQuoteId");

ALTER TABLE "SupplierQuote" ADD CONSTRAINT "SupplierQuote_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SupplierQuote" ADD CONSTRAINT "SupplierQuote_supplierId_fkey"
FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SupplierQuote" ADD CONSTRAINT "SupplierQuote_attachmentId_fkey"
FOREIGN KEY ("attachmentId") REFERENCES "FileUpload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SupplierQuote" ADD CONSTRAINT "SupplierQuote_statusUpdatedByUserId_fkey"
FOREIGN KEY ("statusUpdatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SupplierQuoteLine" ADD CONSTRAINT "SupplierQuoteLine_supplierQuoteId_fkey"
FOREIGN KEY ("supplierQuoteId") REFERENCES "SupplierQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
