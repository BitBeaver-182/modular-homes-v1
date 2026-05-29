CREATE TABLE "Supplier" (
    "id" BIGSERIAL NOT NULL,
    "organizationId" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "email" TEXT,
    "address" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Supplier_organizationId_idx" ON "Supplier"("organizationId");
CREATE INDEX "Supplier_deletedAt_idx" ON "Supplier"("deletedAt");
CREATE INDEX "Supplier_organizationId_deletedAt_idx" ON "Supplier"("organizationId", "deletedAt");
CREATE INDEX "Supplier_organizationId_name_idx" ON "Supplier"("organizationId", "name");
CREATE INDEX "Supplier_organizationId_email_idx" ON "Supplier"("organizationId", "email");
CREATE INDEX "Supplier_organizationId_phoneNumber_idx" ON "Supplier"("organizationId", "phoneNumber");
CREATE INDEX "Supplier_organizationId_createdAt_idx" ON "Supplier"("organizationId", "createdAt");

ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
