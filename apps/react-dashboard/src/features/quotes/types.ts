import type { SupplierQuoteWritableStatus } from "@moduflow/types";

export const QUOTE_SORT_FIELDS = [
	"createdAt",
	"quoteDate",
	"validUntil",
	"totalAmount",
	"supplier.name",
	"status",
	"quoteNumber",
] as const;
export type QuoteSortField = (typeof QUOTE_SORT_FIELDS)[number];

export interface QuoteWriteInput {
	supplierId: string;
	quoteNumber: string;
	quotationDate: string;
	expirationDate: string;
	amount: string;
	currencyCode: string;
	notes: string;
	status: SupplierQuoteWritableStatus;
	pdfFile: File | null;
	removeExistingPdf: boolean;
}
