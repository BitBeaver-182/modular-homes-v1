CREATE TYPE "InstallmentStatus" AS ENUM (
    'scheduled',
    'due',
    'partially_paid',
    'paid',
    'overdue',
    'cancelled'
);

CREATE TYPE "PaymentMethod" AS ENUM (
    'bank_transfer',
    'cash',
    'card',
    'online',
    'other'
);

CREATE TYPE "PaymentStatus" AS ENUM (
    'pending',
    'completed',
    'failed',
    'reversed',
    'refunded'
);

CREATE TABLE "InvoiceInstallment" (
    "id" BIGSERIAL NOT NULL,
    "organizationId" BIGINT NOT NULL,
    "invoiceId" BIGINT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "status" "InstallmentStatus" NOT NULL DEFAULT 'scheduled',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amountDue" DECIMAL(12,2) NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceInstallment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
    "id" BIGSERIAL NOT NULL,
    "organizationId" BIGINT NOT NULL,
    "paymentReference" TEXT,
    "direction" "InvoiceDirection" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'completed',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'bank_transfer',
    "paymentDate" TIMESTAMP(3),
    "currencyCode" CHAR(3) NOT NULL DEFAULT 'EUR',
    "amount" DECIMAL(12,2) NOT NULL,
    "bankAccount" TEXT,
    "transactionId" TEXT,
    "notes" TEXT,
    "recordedByUserId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentAllocation" (
    "id" BIGSERIAL NOT NULL,
    "organizationId" BIGINT NOT NULL,
    "allocationReference" TEXT NOT NULL,
    "paymentId" BIGINT NOT NULL,
    "invoiceId" BIGINT NOT NULL,
    "invoiceInstallmentId" BIGINT,
    "allocatedAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InvoiceInstallment_organizationId_id_key"
ON "InvoiceInstallment"("organizationId", "id");

CREATE UNIQUE INDEX "InvoiceInstallment_invoiceId_installmentNumber_key"
ON "InvoiceInstallment"("invoiceId", "installmentNumber");

CREATE INDEX "InvoiceInstallment_organizationId_idx"
ON "InvoiceInstallment"("organizationId");

CREATE INDEX "InvoiceInstallment_invoiceId_idx"
ON "InvoiceInstallment"("invoiceId");

CREATE INDEX "InvoiceInstallment_status_idx"
ON "InvoiceInstallment"("status");

CREATE INDEX "InvoiceInstallment_dueDate_idx"
ON "InvoiceInstallment"("dueDate");

CREATE UNIQUE INDEX "Payment_organizationId_id_key"
ON "Payment"("organizationId", "id");

CREATE UNIQUE INDEX "Payment_organizationId_paymentReference_key"
ON "Payment"("organizationId", "paymentReference");

CREATE INDEX "Payment_organizationId_idx"
ON "Payment"("organizationId");

CREATE INDEX "Payment_direction_idx"
ON "Payment"("direction");

CREATE INDEX "Payment_status_idx"
ON "Payment"("status");

CREATE INDEX "Payment_paymentDate_idx"
ON "Payment"("paymentDate");

CREATE INDEX "Payment_paymentReference_idx"
ON "Payment"("paymentReference");

CREATE UNIQUE INDEX "PaymentAllocation_organizationId_id_key"
ON "PaymentAllocation"("organizationId", "id");

CREATE UNIQUE INDEX "PaymentAllocation_organizationId_allocationReference_key"
ON "PaymentAllocation"("organizationId", "allocationReference");

CREATE INDEX "PaymentAllocation_paymentId_idx"
ON "PaymentAllocation"("paymentId");

CREATE INDEX "PaymentAllocation_invoiceId_idx"
ON "PaymentAllocation"("invoiceId");

CREATE INDEX "PaymentAllocation_invoiceInstallmentId_idx"
ON "PaymentAllocation"("invoiceInstallmentId");

CREATE INDEX "PaymentAllocation_paymentId_invoiceId_invoiceInstallmentId_idx"
ON "PaymentAllocation"("paymentId", "invoiceId", "invoiceInstallmentId");

CREATE INDEX "PaymentAllocation_organizationId_idx"
ON "PaymentAllocation"("organizationId");

ALTER TABLE "InvoiceInstallment"
ADD CONSTRAINT "InvoiceInstallment_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InvoiceInstallment"
ADD CONSTRAINT "InvoiceInstallment_invoiceId_fkey"
FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_recordedByUserId_fkey"
FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PaymentAllocation"
ADD CONSTRAINT "PaymentAllocation_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PaymentAllocation"
ADD CONSTRAINT "PaymentAllocation_paymentId_fkey"
FOREIGN KEY ("paymentId") REFERENCES "Payment"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentAllocation"
ADD CONSTRAINT "PaymentAllocation_invoiceId_fkey"
FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentAllocation"
ADD CONSTRAINT "PaymentAllocation_invoiceInstallmentId_fkey"
FOREIGN KEY ("invoiceInstallmentId") REFERENCES "InvoiceInstallment"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
