import { moduflowRequest } from "@/lib/moduflow/client";
import type { QuotesQueryParams } from "@/routes/$locale.o.$organizationSlug._admin._operations.quotes";

import { uploadSupplierDocument } from "./upload-api";

import type { QuoteWriteInput } from "../types";
import type {
	CreateSupplierQuoteRequest,
	SupplierQuoteResponse,
	SupplierQuoteListResponse,
	UpdateSupplierQuoteRequest,
} from "@moduflow/types";


export interface QuoteApiContext {
	organizationId: string;
}

const organizationHeaders = ({
	organizationId,
}: QuoteApiContext): HeadersInit => ({
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

const appendDateRange = (
	query: URLSearchParams,
	range: QuotesQueryParams["quoteDate"],
	keys: { from: string; to: string }
): void => {
	if (!range) {
		return;
	}
	appendOptionalString(query, keys.from, range.from);
	appendOptionalString(query, keys.to, range.to);
};

const appendNumberRange = (
	query: URLSearchParams,
	range: QuotesQueryParams["amount"],
	keys: { min: string; max: string }
): void => {
	if (!range) {
		return;
	}
	if (range.min !== undefined) {
		query.set(keys.min, String(range.min));
	}
	if (range.max !== undefined) {
		query.set(keys.max, String(range.max));
	}
};

export const toQuoteQueryString = (params: QuotesQueryParams): string => {
	const query = new URLSearchParams();
	query.set("page", String(params.page));
	query.set("limit", String(params.pageSize));

	appendOptionalString(query, "search", params.search);

	if (params.sortBy && params.sortOrder) {
		query.set("sort[field]", params.sortBy);
		query.set("sort[criteria]", params.sortOrder === "asc" ? "asc" : "desc");
	}

	appendArray(query, "status", params.quote_status);
	appendArray(query, "supplierIds", params.supplier_ids);
	appendDateRange(query, params.quoteDate, {
		from: "quoteDateFrom",
		to: "quoteDateTo",
	});
	appendNumberRange(query, params.amount, {
		min: "totalAmountMin",
		max: "totalAmountMax",
	});

	return query.toString();
};

const numberOrUndefined = (value: string): number | undefined => {
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : undefined;
};

const buildWritePayload = (
	input: QuoteWriteInput,
	attachmentId: string | null | undefined
): CreateSupplierQuoteRequest | UpdateSupplierQuoteRequest => {
	const amount = numberOrUndefined(input.amount);
	const payload: CreateSupplierQuoteRequest | UpdateSupplierQuoteRequest = {
		supplierId: input.supplierId.trim(),
		quoteNumber: input.quoteNumber.trim() || null,
		status: input.status,
		quoteDate: input.quotationDate || null,
		validUntil: input.expirationDate || null,
		currencyCode: input.currencyCode.trim().toUpperCase(),
		notes: input.notes.trim() || null,
	};

	if (amount !== undefined) {
		payload.subtotalAmount = amount;
		payload.totalAmount = amount;
	}
	if (attachmentId !== undefined) {
		payload.attachmentId = attachmentId;
	}

	return payload;
};

export const getQuotes = async (
	context: QuoteApiContext,
	parameters: QuotesQueryParams
): Promise<SupplierQuoteListResponse> =>
	moduflowRequest<SupplierQuoteListResponse>(
		`/supplier-quotes?${toQuoteQueryString(parameters)}`,
		{
			headers: organizationHeaders(context),
			method: "GET",
		}
	);

export const getQuote = async (
	context: QuoteApiContext,
	id: string
): Promise<SupplierQuoteResponse> =>
	moduflowRequest<SupplierQuoteResponse>(
		`/supplier-quotes/${encodeURIComponent(id)}`,
		{
		headers: organizationHeaders(context),
		method: "GET",
		}
	);

export const createQuote = async (
	context: QuoteApiContext,
	input: QuoteWriteInput
): Promise<SupplierQuoteResponse> => {
	const attachment = input.pdfFile
		? await uploadSupplierDocument(context, input.pdfFile)
		: null;
	return moduflowRequest<SupplierQuoteResponse>("/supplier-quotes", {
		body: buildWritePayload(input, attachment?.id),
		headers: organizationHeaders(context),
		method: "POST",
	});
};

export const updateQuote = async (
	context: QuoteApiContext,
	id: string,
	input: QuoteWriteInput
): Promise<SupplierQuoteResponse> => {
	const attachment = input.pdfFile
		? await uploadSupplierDocument(context, input.pdfFile)
		: null;
	const attachmentId = input.pdfFile
		? attachment?.id
		: input.removeExistingPdf
			? null
			: undefined;

	return moduflowRequest<SupplierQuoteResponse>(
		`/supplier-quotes/${encodeURIComponent(id)}`,
		{
		body: buildWritePayload(input, attachmentId),
		headers: organizationHeaders(context),
		method: "PATCH",
		}
	);
};

export const deleteQuote = async (
	context: QuoteApiContext,
	id: string
): Promise<void> =>
	moduflowRequest<void>(`/supplier-quotes/${encodeURIComponent(id)}`, {
		headers: organizationHeaders(context),
		method: "DELETE",
	});
