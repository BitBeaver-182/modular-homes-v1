import { moduflowRequest } from "@/lib/moduflow/client";
import type { QuotesQueryParams } from "@/routes/$locale.o.$organizationSlug._admin._operations.quotes";

import { uploadSupplierDocument } from "./upload-api";

import type { Quote, QuoteWriteInput } from "../types";
import type {
	CreateSupplierQuoteRequest,
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
	for (const value of values) {
		query.append(key, value);
	}
};

const toQuoteQueryString = (params: QuotesQueryParams): string => {
	const query = new URLSearchParams();
	query.set("page", String(params.page));
	query.set("limit", String(params.pageSize));

	if (params.search) {
		query.set("search", params.search);
	}
	if (params.sortBy) {
		query.set("sort[field]", params.sortBy);
		query.set("sort[criteria]", params.sortOrder === "asc" ? "asc" : "desc");
	}
	appendArray(query, "status", params.quote_status);
	appendArray(query, "supplierIds", params.supplier_ids);

	if (params.quoteDate?.from) {
		query.set("quoteDateFrom", params.quoteDate.from);
	}
	if (params.quoteDate?.to) {
		query.set("quoteDateTo", params.quoteDate.to);
	}
	if (params.amount?.min !== undefined) {
		query.set("totalAmountMin", String(params.amount.min));
	}
	if (params.amount?.max !== undefined) {
		query.set("totalAmountMax", String(params.amount.max));
	}

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
): Promise<Quote> =>
	moduflowRequest<Quote>(`/supplier-quotes/${encodeURIComponent(id)}`, {
		headers: organizationHeaders(context),
		method: "GET",
	});

export const createQuote = async (
	context: QuoteApiContext,
	input: QuoteWriteInput
): Promise<Quote> => {
	const attachment = input.pdfFile
		? await uploadSupplierDocument(context, input.pdfFile)
		: null;
	return moduflowRequest<Quote>("/supplier-quotes", {
		body: buildWritePayload(input, attachment?.id),
		headers: organizationHeaders(context),
		method: "POST",
	});
};

export const updateQuote = async (
	context: QuoteApiContext,
	id: string,
	input: QuoteWriteInput
): Promise<Quote> => {
	const attachment = input.pdfFile
		? await uploadSupplierDocument(context, input.pdfFile)
		: null;
	const attachmentId = input.pdfFile
		? attachment?.id
		: input.removeExistingPdf
			? null
			: undefined;

	return moduflowRequest<Quote>(`/supplier-quotes/${encodeURIComponent(id)}`, {
		body: buildWritePayload(input, attachmentId),
		headers: organizationHeaders(context),
		method: "PATCH",
	});
};

export const deleteQuote = async (
	context: QuoteApiContext,
	id: string
): Promise<void> =>
	moduflowRequest<void>(`/supplier-quotes/${encodeURIComponent(id)}`, {
		headers: organizationHeaders(context),
		method: "DELETE",
	});
