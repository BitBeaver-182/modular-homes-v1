import type { SupplierOrdersSearchParameters } from "@/features/supplier-orders/search-parameters";
import { moduflowRequest } from "@/lib/moduflow/client";

import type {
	CreateSupplierOrderInvoiceRequest,
	CreateSupplierOrderRequest,
	SupplierOrderDetailInvoiceResponse,
	SupplierOrderDetailResponse,
	SupplierOrderLineWriteInput,
	SupplierOrderListItemResponse,
	SupplierOrderListResponse,
	UpdateSupplierOrderInvoiceRequest,
	UpdateSupplierOrderRequest,
} from "@moduflow/types";

export interface SupplierOrderApiContext {
	organizationId: string;
}

const organizationHeaders = ({
	organizationId,
}: SupplierOrderApiContext): HeadersInit => ({
	"x-organization-id": organizationId,
});

const appendArray = (
	query: URLSearchParams,
	key: string,
	values: Array<string> | undefined
): void => {
	if (!values || values.length === 0) {
		return;
	}

	for (const value of values.map((item) => item.trim()).filter(Boolean)) {
		query.append(key, value);
	}
};

const appendOptionalString = (
	query: URLSearchParams,
	key: string,
	value: string | undefined
): void => {
	const normalized = value?.trim();
	if (normalized) {
		query.set(key, normalized);
	}
};

export const toSupplierOrderQueryString = (
	parameters: SupplierOrdersSearchParameters
): string => {
	const query = new URLSearchParams();
	query.set("page", String(parameters.page));
	query.set("limit", String(parameters.pageSize));

	appendOptionalString(query, "search", parameters.search);

	if (parameters.sortBy && parameters.sortOrder) {
		query.set("sortField", parameters.sortBy === "orderStatus" ? "status" : parameters.sortBy);
		query.set(
			"sortCriteria",
			parameters.sortOrder === "asc" ? "asc" : "desc"
		);
	}

	appendArray(query, "status", parameters.order_status);
	appendArray(query, "supplierIds", parameters.supplier_ids);

	if (parameters.createdAt?.from) {
		query.set("createdFrom", parameters.createdAt.from);
	}
	if (parameters.createdAt?.to) {
		query.set("createdTo", parameters.createdAt.to);
	}

	return query.toString();
};

export const getSupplierOrders = async (
	context: SupplierOrderApiContext,
	parameters: SupplierOrdersSearchParameters,
): Promise<SupplierOrderListResponse> =>
	moduflowRequest<SupplierOrderListResponse>(
		`/supplier-orders?${toSupplierOrderQueryString(parameters)}`,
		{
			headers: organizationHeaders(context),
			method: "GET",
		}
	);

export const getSupplierOrderDetail = async (
	context: SupplierOrderApiContext,
	orderId: string,
): Promise<SupplierOrderDetailResponse> =>
	moduflowRequest<SupplierOrderDetailResponse>(
		`/supplier-orders/${encodeURIComponent(orderId)}`,
		{
			headers: organizationHeaders(context),
			method: "GET",
		}
	);

export const updateSupplierOrder = async (
	context: SupplierOrderApiContext,
	orderId: string,
	input: UpdateSupplierOrderRequest,
): Promise<SupplierOrderDetailResponse> =>
	moduflowRequest<SupplierOrderDetailResponse>(
		`/supplier-orders/${encodeURIComponent(orderId)}`,
		{
			body: input,
			headers: organizationHeaders(context),
			method: "PATCH",
		}
	);

export const createSupplierOrderInvoice = async (
	context: SupplierOrderApiContext,
	orderId: string,
	input: CreateSupplierOrderInvoiceRequest,
): Promise<SupplierOrderDetailInvoiceResponse> =>
	moduflowRequest<SupplierOrderDetailInvoiceResponse>(
		`/supplier-orders/${encodeURIComponent(orderId)}/invoices`,
		{
			body: input,
			headers: organizationHeaders(context),
			method: "POST",
		},
	);

export const updateSupplierOrderInvoice = async (
	context: SupplierOrderApiContext,
	orderId: string,
	invoiceId: string,
	input: UpdateSupplierOrderInvoiceRequest,
): Promise<SupplierOrderDetailInvoiceResponse> =>
	moduflowRequest<SupplierOrderDetailInvoiceResponse>(
		`/supplier-orders/${encodeURIComponent(orderId)}/invoices/${encodeURIComponent(invoiceId)}`,
		{
			body: input,
			headers: organizationHeaders(context),
			method: "PATCH",
		},
	);

export const deleteSupplierOrderInvoice = async (
	context: SupplierOrderApiContext,
	orderId: string,
	invoiceId: string,
): Promise<void> =>
	moduflowRequest<void>(
		`/supplier-orders/${encodeURIComponent(orderId)}/invoices/${encodeURIComponent(invoiceId)}`,
		{
			headers: organizationHeaders(context),
			method: "DELETE",
		}
	);

export type {
	SupplierOrderLineWriteInput,
	UpdateSupplierOrderRequest,
};

export const createSupplierOrderFromQuote = async (args: {
	organizationId: string;
	quoteId: string;
}): Promise<SupplierOrderListItemResponse> =>
	moduflowRequest<SupplierOrderListItemResponse>("/supplier-orders", {
		body: {
			quoteId: args.quoteId,
		} satisfies CreateSupplierOrderRequest,
		headers: organizationHeaders({ organizationId: args.organizationId }),
		method: "POST",
	});
