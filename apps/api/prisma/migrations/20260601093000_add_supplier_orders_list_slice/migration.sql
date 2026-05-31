CREATE TYPE "SupplierOrderStatus" AS ENUM (
    'draft',
    'placed',
    'confirmed',
    'in_production',
    'ready_to_ship',
    'shipped',
    'arrived',
    'closed',
    'cancelled'
);

CREATE TYPE "InvoiceDirection" AS ENUM ('payable', 'receivable');

CREATE TYPE "InvoiceStatus" AS ENUM (
    'draft',
    'issued',
    'partially_paid',
    'paid',
    'overdue',
    'disputed',
    'cancelled',
    'void'
);

CREATE TYPE "InvoiceType" AS ENUM (
    'supplier_goods',
    'customer_sale',
    'logistics',
    'customs',
    'storage',
    'delay_fee',
    'insurance',
    'tax',
    'credit_note',
    'other'
);

CREATE TABLE "SupplierOrder" (
    "id" BIGSERIAL NOT NULL,
    "organizationId" BIGINT NOT NULL,
    "supplierId" BIGINT NOT NULL,
    "supplierQuoteId" BIGINT,
    "orderNumber" TEXT,
    "supplierPoNumber" TEXT,
    "status" "SupplierOrderStatus" NOT NULL DEFAULT 'draft',
    "orderDate" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "expectedReadyDate" TIMESTAMP(3),
    "expectedShipDate" TIMESTAMP(3),
    "expectedArrivalDate" TIMESTAMP(3),
    "currencyCode" CHAR(3) NOT NULL DEFAULT 'USD',
    "subtotalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "shippingAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "incoterm" TEXT,
    "paymentTerms" TEXT,
    "loadingPort" TEXT,
    "destinationPort" TEXT,
    "notes" TEXT,
    "createdByUserId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupplierOrderLine" (
    "id" BIGSERIAL NOT NULL,
    "organizationId" BIGINT NOT NULL,
    "supplierOrderId" BIGINT NOT NULL,
    "supplierQuoteLineId" BIGINT,
    "houseModelId" BIGINT,
    "productConfigurationId" BIGINT,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierOrderLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Invoice" (
    "id" BIGSERIAL NOT NULL,
    "organizationId" BIGINT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "direction" "InvoiceDirection" NOT NULL,
    "invoiceType" "InvoiceType" NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'draft',
    "supplierId" BIGINT,
    "supplierOrderId" BIGINT,
    "issueDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "currencyCode" CHAR(3) NOT NULL DEFAULT 'EUR',
    "exchangeRateToBase" DECIMAL(16,6),
    "subtotalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balanceDue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SupplierOrder_organizationId_id_key"
ON "SupplierOrder"("organizationId", "id");

CREATE UNIQUE INDEX "SupplierOrder_organizationId_orderNumber_key"
ON "SupplierOrder"("organizationId", "orderNumber");

CREATE INDEX "SupplierOrder_organizationId_idx"
ON "SupplierOrder"("organizationId");

CREATE INDEX "SupplierOrder_organizationId_status_idx"
ON "SupplierOrder"("organizationId", "status");

CREATE INDEX "SupplierOrder_organizationId_createdAt_idx"
ON "SupplierOrder"("organizationId", "createdAt");

CREATE INDEX "SupplierOrder_supplierId_idx"
ON "SupplierOrder"("supplierId");

CREATE INDEX "SupplierOrder_supplierQuoteId_idx"
ON "SupplierOrder"("supplierQuoteId");

CREATE INDEX "SupplierOrder_orderDate_idx"
ON "SupplierOrder"("orderDate");

CREATE INDEX "SupplierOrder_expectedArrivalDate_idx"
ON "SupplierOrder"("expectedArrivalDate");

CREATE UNIQUE INDEX "SupplierOrderLine_organizationId_id_key"
ON "SupplierOrderLine"("organizationId", "id");

CREATE INDEX "SupplierOrderLine_organizationId_idx"
ON "SupplierOrderLine"("organizationId");

CREATE INDEX "SupplierOrderLine_supplierOrderId_idx"
ON "SupplierOrderLine"("supplierOrderId");

CREATE INDEX "SupplierOrderLine_supplierQuoteLineId_idx"
ON "SupplierOrderLine"("supplierQuoteLineId");

CREATE INDEX "SupplierOrderLine_houseModelId_idx"
ON "SupplierOrderLine"("houseModelId");

CREATE INDEX "SupplierOrderLine_productConfigurationId_idx"
ON "SupplierOrderLine"("productConfigurationId");

CREATE UNIQUE INDEX "Invoice_organizationId_id_key"
ON "Invoice"("organizationId", "id");

CREATE UNIQUE INDEX "Invoice_organizationId_invoiceNumber_key"
ON "Invoice"("organizationId", "invoiceNumber");

CREATE INDEX "Invoice_organizationId_idx"
ON "Invoice"("organizationId");

CREATE INDEX "Invoice_organizationId_status_idx"
ON "Invoice"("organizationId", "status");

CREATE INDEX "Invoice_supplierId_idx"
ON "Invoice"("supplierId");

CREATE INDEX "Invoice_supplierOrderId_idx"
ON "Invoice"("supplierOrderId");

CREATE INDEX "Invoice_direction_idx"
ON "Invoice"("direction");

CREATE INDEX "Invoice_invoiceType_idx"
ON "Invoice"("invoiceType");

CREATE INDEX "Invoice_dueDate_idx"
ON "Invoice"("dueDate");

ALTER TABLE "SupplierOrder"
ADD CONSTRAINT "SupplierOrder_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SupplierOrder"
ADD CONSTRAINT "SupplierOrder_supplierId_fkey"
FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SupplierOrder"
ADD CONSTRAINT "SupplierOrder_supplierQuoteId_fkey"
FOREIGN KEY ("supplierQuoteId") REFERENCES "SupplierQuote"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SupplierOrder"
ADD CONSTRAINT "SupplierOrder_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SupplierOrderLine"
ADD CONSTRAINT "SupplierOrderLine_supplierOrderId_fkey"
FOREIGN KEY ("supplierOrderId") REFERENCES "SupplierOrder"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Invoice"
ADD CONSTRAINT "Invoice_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Invoice"
ADD CONSTRAINT "Invoice_supplierId_fkey"
FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Invoice"
ADD CONSTRAINT "Invoice_supplierOrderId_fkey"
FOREIGN KEY ("supplierOrderId") REFERENCES "SupplierOrder"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
