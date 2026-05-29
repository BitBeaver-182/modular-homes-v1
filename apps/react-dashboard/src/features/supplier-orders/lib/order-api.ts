import type { SupplierOrdersSearchParameters } from "@/features/supplier-orders/search-parameters";
import { strapiClient, type StrapiQueryParams } from "@/lib/strapi";

import type {
	PaginatedResult,
	SupplierOrder,
} from "../types";

const LIST_POPULATE = {
	quote: {
		populate: {
			supplier: true,
			total: true,
			pdf: true,
		},
	},
	supplier: true,
	invoices: {
		populate: {
			total: true,
			amountPaid: true,
			amountRemaining: true,
		},
	},
} as const;

const toStrapiQueryParameters = (
	parameters: SupplierOrdersSearchParameters,
): StrapiQueryParams<Array<SupplierOrder>> => {
	const sort = parameters.sortBy
		? `${parameters.sortBy}:${parameters.sortOrder === "asc" ? "asc" : "desc"}`
		: undefined;

	const query: StrapiQueryParams<Array<SupplierOrder>> = {
		pagination: {
			page: parameters.page,
			pageSize: parameters.pageSize,
		},
		sort,
		populate: LIST_POPULATE,
	};

	if (
		Array.isArray(parameters.order_status) &&
		parameters.order_status.length > 0
	) {
		query.filters = {
			...query.filters,
			orderStatus: {
				$in: [...parameters.order_status],
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
		const trimmed = parameters.search.trim();
		if (trimmed.length === 0) {
			return query;
		}
		const parsedNumeric = Number.parseInt(trimmed, 10);
		const hasNumericToken = Number.isFinite(parsedNumeric);

		query.filters = {
			...query.filters,
			$or: [
				{ documentId: { $containsi: trimmed } },
				...(hasNumericToken ? [{ id: { $eq: parsedNumeric } }] : []),
			],
		};
	}

	return query;
};

export const getSupplierOrders = async (
	parameters: SupplierOrdersSearchParameters,
): Promise<PaginatedResult<SupplierOrder>> => {
	const response = await strapiClient
		.from<Array<SupplierOrder>>("supplier-orders")
		.find(toStrapiQueryParameters(parameters));

	return response as PaginatedResult<SupplierOrder>;
};

export const createSupplierOrderFromQuote = async (args: {
	quoteDocumentId: string;
}): Promise<SupplierOrder> => {
	const payload = {
		quote: { connect: [args.quoteDocumentId] as [string] },
	};

	const response = await strapiClient.from<SupplierOrder>("supplier-orders").create(
		payload as unknown as Partial<SupplierOrder>,
	);

	return response.data;
};
