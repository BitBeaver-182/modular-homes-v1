import type { Supplier } from "@/features/suppliers/types";
import { AttachmentMedia } from "@/lib/strapi";

export const QUOTE_STATUSES = ["pending", "accepted", "rejected"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QUOTE_SORT_FIELDS = [
	"createdAt",
	"total.amount",
	"supplier.name",
	"quoteStatus",
] as const;
export type QuoteSortField = (typeof QUOTE_SORT_FIELDS)[number];

export type QuotePdfMedia = {
	id: number;
	url: string;
	name: string;
	size?: number;
	mime?: string;
};

export type QuoteTotal = {
	amount: number;
	currency_code: string;
};

export type QuoteSupplierOrderRef = {
	id: number;
	documentId: string;
};

export type Quote = {
	id: number;
	documentId: string;
	quotation_date: string | null;
	expiration_date: string | null;
	createdAt: string;
	updatedAt: string;
	publishedAt: string;
	notes: string;
	quote_status: QuoteStatus | null;
	supplier: Supplier | null;
	total: QuoteTotal | null;
	pdf?: AttachmentMedia;
	/** Legacy `api::order.order` links; prefer {@link Quote.supplierOrders}. */
	orders?: Array<QuoteSupplierOrderRef> | null;
	supplierOrders?: Array<QuoteSupplierOrderRef> | null;
};

export type QuoteWriteInput = {
	supplierId: string;
	quotationDate: string;
	expirationDate: string;
	amount: string;
	currencyCode: string;
	notes: string;
	status: QuoteStatus;
	pdfFile: File | null;
	removeExistingPdf: boolean;
};

export type PaginatedResult<T> = {
	data: Array<T>;
	meta: {
		pagination: {
			page: number;
			pageSize: number;
			pageCount: number;
			total: number;
		};
	};
};
