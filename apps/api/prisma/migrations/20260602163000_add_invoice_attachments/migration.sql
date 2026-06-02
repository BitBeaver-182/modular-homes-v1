ALTER TABLE "Invoice"
ADD COLUMN "attachmentId" TEXT;

CREATE UNIQUE INDEX "Invoice_attachmentId_key"
ON "Invoice"("attachmentId");

ALTER TABLE "Invoice"
ADD CONSTRAINT "Invoice_attachmentId_fkey"
FOREIGN KEY ("attachmentId") REFERENCES "FileUpload"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
