import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import {
	createSortSchema,
	dateRangeSchema,
	numberRangeSchema,
} from "@/common/validation-schema";
import QuotesPage from "@/features/quotes";
import {
	QUOTE_FILTER_STATUSES,
	QUOTE_SORT_FIELDS,
} from "@/features/quotes/types";

const quoteFilterStatusSchema = z.enum(QUOTE_FILTER_STATUSES);
const quoteSortSchema = createSortSchema(QUOTE_SORT_FIELDS);

export const tableFiltersSchema = z.object({
	page: z.coerce.number().min(1).catch(1),
	pageSize: z.coerce.number().min(1).catch(10),
	search: z.coerce.string().optional(),
});

const quoteFiltersSchema = z.object({
	quote_status: z.array(quoteFilterStatusSchema).optional(),
	quoteDate: dateRangeSchema.optional().catch(undefined),
	// Using flat keys for cleaner URLs as discussed
	supplier_ids: z.array(z.string()).optional().catch(undefined),
	amount: numberRangeSchema.optional().catch(undefined),
});

const queryParamsSchema = z.object({
	...tableFiltersSchema.shape,
	...quoteFiltersSchema.shape,
	...quoteSortSchema.shape,
});

export const Route = createFileRoute(
	"/$locale/o/$organizationSlug/_admin/_operations/quotes"
)({
	validateSearch: queryParamsSchema,
	component: QuotesPage,
});

export type QuoteSortSchema = z.infer<typeof quoteSortSchema>;
export type QuotesQueryParams = z.infer<typeof queryParamsSchema>;
