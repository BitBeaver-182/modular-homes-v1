import type { AttachmentMedia, StrapiMoney } from "@/lib/strapi";

import type { SupplierResponse } from "@moduflow/types";

/** Strapi `supplier-order.orderStatus` enum. */
export const SUPPLIER_ORDER_STATUSES = [
	"draft",
	"processing",
	"shipped",
	"delivered",
	"cancelled",
] as const;
export type SupplierOrderStatus = (typeof SUPPLIER_ORDER_STATUSES)[number];

/** Sort fields sent to Strapi REST (attribute paths). */
export const SUPPLIER_ORDER_SORT_FIELDS = [
	"id",
	"createdAt",
	"orderStatus",
	"supplier.name",
] as const;

export type SupplierOrderSortField = (typeof SUPPLIER_ORDER_SORT_FIELDS)[number];

/** Strapi `supplier-invoice.invoiceStatus` enum. */
export const SUPPLIER_INVOICE_STATUSES = [
	"pending",
	"paid",
	"overdue",
] as const;
export type SupplierInvoiceStatus = (typeof SUPPLIER_INVOICE_STATUSES)[number];

export const SUPPLIER_INVOICE_PAYMENT_METHODS = [
	"wire",
	"card",
	"cash",
	"check",
	"other",
] as const;
export type SupplierInvoicePaymentMethod =
	(typeof SUPPLIER_INVOICE_PAYMENT_METHODS)[number];

export interface SupplierOrderQuoteRef {
	id: number;
	documentId: string;
	supplier: SupplierResponse | null;
	total: StrapiMoney | null;
	expiration_date?: string | null;
	pdf?: AttachmentMedia | null;
}

export interface SupplierOrderInvoicePayment {
	id: number;
	documentId: string;
	createdAt: string;
	updatedAt: string;
	paymentAmount: StrapiMoney;
	paymentDate: string;
	method: SupplierInvoicePaymentMethod;
	notes: string | null;
	invoice?: Pick<SupplierOrderInvoice, "documentId" | "invoiceNumber"> | null;
}

export interface SupplierOrderInvoice {
	id: number;
	documentId: string;
	createdAt: string;
	updatedAt: string;
	invoiceNumber: string | null;
	vendorName: string;
	invoiceStatus: SupplierInvoiceStatus | null;
	expirationDate: string;
	attachment: AttachmentMedia | null;
	total: StrapiMoney | null;
	amountPaid: StrapiMoney | null;
	amountRemaining: StrapiMoney | null;
	payments?: Array<SupplierOrderInvoicePayment> | null;
	supplierOrder?: Pick<SupplierOrder, "documentId"> | null;
}

export interface SupplierOrderHistoryEntry {
	id: number;
	documentId: string;
	createdAt: string;
	updatedAt: string;
	message: string;
	at: string;
	meta?: Record<string, unknown> | null;
}

export interface SupplierOrderLine {
	id?: number;
	__tempId?: string;
	description: string;
	quantity: number | string;
	unit_price: StrapiMoney;
	line_total: StrapiMoney | null;
}

export interface SupplierOrder {
	id: number;
	documentId: string;
	createdAt: string;
	updatedAt: string;
	orderStatus: SupplierOrderStatus;
	trackingUrl: string | null;
	quote: SupplierOrderQuoteRef | null;
	supplier: SupplierResponse | null;
	orderLines?: Array<SupplierOrderLine> | null;
	invoices?: Array<SupplierOrderInvoice> | null;
	historyEntries?: Array<SupplierOrderHistoryEntry> | null;
}

export interface PaginatedResult<T> {
	data: Array<T>;
	meta: {
		pagination: {
			page: number;
			pageSize: number;
			pageCount: number;
			total: number;
		};
	};
}
