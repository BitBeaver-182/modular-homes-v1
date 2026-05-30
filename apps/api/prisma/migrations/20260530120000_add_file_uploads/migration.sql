CREATE TYPE "FileUploadStatus" AS ENUM ('PENDING', 'CONFIRMED', 'ORPHANED', 'DELETED');
CREATE TYPE "FileContext" AS ENUM ('AVATAR', 'ORGANIZATION_LOGO', 'SUPPLIER_DOCUMENT');

CREATE TABLE "FileUpload" (
    "id" TEXT NOT NULL,
    "organizationId" BIGINT NOT NULL,
    "uploadedById" BIGINT NOT NULL,
    "bucket" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "status" "FileUploadStatus" NOT NULL DEFAULT 'PENDING',
    "context" "FileContext" NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "FileUpload_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FileUpload_organizationId_idx" ON "FileUpload"("organizationId");
CREATE INDEX "FileUpload_uploadedById_idx" ON "FileUpload"("uploadedById");

ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_uploadedById_fkey"
FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
