import type {
	FileUploadResponse,
	SupplierQuoteListResponse,
	SupplierQuoteResponse,
	SupplierQuoteStatus,
} from "@moduflow/types";
import { SUPPLIER_QUOTE_STATUSES } from "@moduflow/types";

export const QUOTE_STATUSES = SUPPLIER_QUOTE_STATUSES;
export type QuoteStatus = SupplierQuoteStatus;

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

export type Quote = SupplierQuoteResponse;
export type QuoteAttachment = FileUploadResponse;
export type PaginatedResult<T> = T extends Quote
	? SupplierQuoteListResponse
	: {
			data: Array<T>;
			meta: SupplierQuoteListResponse["meta"];
		};

export interface QuoteWriteInput {
	supplierId: string;
	quoteNumber: string;
	quotationDate: string;
	expirationDate: string;
	amount: string;
	currencyCode: string;
	notes: string;
	status: QuoteStatus;
	pdfFile: File | null;
	removeExistingPdf: boolean;
}
