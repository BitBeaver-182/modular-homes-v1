import {
	strapiClient,
	strapiConfig,
	type AttachmentMedia,
	type StrapiQueryParams,
} from "@/lib/strapi";
import type { QuotesQueryParams } from "@/routes/$locale.o.$organizationSlug._admin._operations.quotes";
import type { PaginatedResult, Quote, QuoteWriteInput } from "../types";

const POPULATE = {
	supplier: true,
	attachment: true,
	total: true,
	supplierOrders: true,
} as const;

type QuoteApiRecord = {
	id: number;
	documentId: string;
	issueAt: string | null;
	expiresAt: string | null;
	createdAt: string;
	updatedAt: string;
	publishedAt: string;
	notes: string;
	quoteStatus: Quote["quote_status"] | null;
	supplier: Quote["supplier"] | null;
	total: Quote["total"] | null;
	attachment?: AttachmentMedia | null;
	supplierOrders?: Quote["supplierOrders"] | null;
};

/**
 * Translates our standard route query params into Strapi's specific format.
 * Extra `filters[…]` keys (Zod-passthrough) are decoded via the shared filters
 * adapter and merged with the free-text search `$or` block.
 */
const toStrapiQueryParameters = (
	parameters: QuotesQueryParams
): StrapiQueryParams<Array<QuoteApiRecord>> => {
	const sort = parameters.sortBy
		? `${parameters.sortBy}:${parameters.sortOrder === "asc" ? "asc" : "desc"}`
		: undefined;

	const query: StrapiQueryParams<Array<QuoteApiRecord>> = {
		pagination: {
			page: parameters.page,
			pageSize: parameters.pageSize,
		},
		sort,
		populate: POPULATE,
	};

	if (
		Array.isArray(parameters.quote_status) &&
		parameters.quote_status.length > 0
	) {
		query.filters = {
			...query.filters,
			quoteStatus: {
				$in: [...parameters.quote_status],
			},
		};
	}

	if (
		parameters.createdAt &&
		(parameters.createdAt.from || parameters.createdAt.to)
	) {
		query.filters = {
			...query.filters,
			createdAt: {
				$gte: parameters.createdAt.from,
				$lte: parameters.createdAt.to,
			},
		};
	}

	if (parameters.amount && (parameters.amount.min || parameters.amount.max)) {
		query.filters = {
			...query.filters,
			total: {
				amount: {
					$gte: parameters.amount.min,
					$lte: parameters.amount.max,
				},
			},
		};
	}

	if (parameters.supplier_ids) {
		query.filters = {
			...query.filters,
			supplier: {
				documentId: {
					$in: [...parameters.supplier_ids],
				},
			},
		};
	}

	if (parameters.search) {
		query.filters = {
			...query.filters,
			$or: [
				{ supplier: { name: { $containsi: parameters.search } } },
				{ notes: { $containsi: parameters.search } },
				{ attachment: { name: { $containsi: parameters.search } } },
				{ attachment: { url: { $containsi: parameters.search } } },
			],
		};
	}

	return query;
};

/** Prepend the Strapi base URL when the backend returns a relative media URL. */
const withAbsoluteMediaUrl = (
	media: AttachmentMedia | null | undefined
): AttachmentMedia | undefined => {
	if (!media) {
		return undefined;
	}

	const pdfUrl = media.url;
	if (
		!pdfUrl ||
		pdfUrl.startsWith("http://") ||
		pdfUrl.startsWith("https://")
	) {
		return media;
	}

	return {
		...media,
		url: `${strapiConfig.baseUrl}${pdfUrl.startsWith("/") ? "" : "/"}${pdfUrl}`,
	};
};

const fromQuoteApi = (quote: QuoteApiRecord): Quote => ({
	id: quote.id,
	documentId: quote.documentId,
	quotation_date: quote.issueAt,
	expiration_date: quote.expiresAt,
	createdAt: quote.createdAt,
	updatedAt: quote.updatedAt,
	publishedAt: quote.publishedAt,
	notes: quote.notes,
	quote_status: quote.quoteStatus,
	supplier: quote.supplier ?? null,
	total: quote.total ?? null,
	pdf: withAbsoluteMediaUrl(quote.attachment),
	supplierOrders: quote.supplierOrders ?? null,
});

const normalizeQuotes = (quotes: Array<QuoteApiRecord>): Array<Quote> =>
	quotes.map(fromQuoteApi);

const buildWritePayload = (
	input: QuoteWriteInput,
	relationMode: "connect" | "set"
): Record<string, unknown> => {
	const numericAmount = Number.parseFloat(input.amount);
	const hasAmount = Number.isFinite(numericAmount);
	const normalizedCurrency = input.currencyCode.trim().toUpperCase();
	const hasCurrency = normalizedCurrency.length === 3;

	const payload: Record<string, unknown> = {
		issueAt: input.quotationDate || null,
		expiresAt: input.expirationDate || null,
		notes: input.notes.trim(),
		quoteStatus: input.status,
	};

	if (hasAmount && hasCurrency) {
		payload["total"] = {
			amount: numericAmount,
			currency_code: normalizedCurrency,
		};
	}

	const supplierId = input.supplierId.trim();
	if (supplierId) {
		payload["supplier"] =
			relationMode === "connect"
				? { connect: [supplierId] }
				: { set: [supplierId] };
	}

	if (input.removeExistingPdf && !input.pdfFile) {
		payload["attachment"] = null;
	}

	return payload;
};

export const getQuotes = async (
	parameters: QuotesQueryParams
): Promise<PaginatedResult<Quote>> => {
	const response = await strapiClient
		.from<Array<QuoteApiRecord>>("quotes")
		.find(toStrapiQueryParameters(parameters));
	const paginated = response as PaginatedResult<QuoteApiRecord>;

	return {
		...paginated,
		data: normalizeQuotes(paginated.data),
	};
};

export const getQuote = async (documentId: string): Promise<Quote> => {
	const response = await strapiClient.request<QuoteApiRecord>(
		`/quotes/${encodeURIComponent(documentId)}`,
		{
			method: "GET",
			query: { populate: POPULATE } as StrapiQueryParams<QuoteApiRecord>,
		}
	);

	return fromQuoteApi(response.data);
};

export const createQuote = async (input: QuoteWriteInput): Promise<Quote> => {
	const payload = buildWritePayload(input, "connect");
	if (input.pdfFile) {
		const uploadResponse = await strapiClient
			.from<QuoteApiRecord>("quotes")
			.uploadFile(input.pdfFile);
		const [media] = uploadResponse.data;
		if (media) {
			payload["attachment"] = media.id;
		}
	}

	const response = await strapiClient
		.from<QuoteApiRecord>("quotes")
		.create(payload as Partial<QuoteApiRecord>);

	return getQuote(response.data.documentId);
};

export const updateQuote = async (
	documentId: string,
	input: QuoteWriteInput
): Promise<Quote> => {
	const payload = buildWritePayload(input, "set");
	if (input.pdfFile) {
		const uploadResponse = await strapiClient
			.from<QuoteApiRecord>("quotes")
			.uploadFile(input.pdfFile);
		const [media] = uploadResponse.data;
		if (media) {
			payload["attachment"] = media.id;
		}
	}

	await strapiClient
		.from<QuoteApiRecord>("quotes")
		.update(documentId, payload as Partial<QuoteApiRecord>);

	return getQuote(documentId);
};

export const deleteQuote = async (documentId: string): Promise<void> => {
	await strapiClient.from<Quote>("quotes").delete(documentId);
};
