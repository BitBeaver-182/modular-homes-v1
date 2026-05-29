import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import type { QuotesQueryParams } from "@/routes/$locale.o.$organizationSlug._admin._operations.quotes";

import { quoteKeys } from "./quote-keys";
import { getQuotes } from "../lib/quote-api";

import type { PaginatedResult, Quote } from "../types";

export const useGetQuotes = (
	params: QuotesQueryParams
): UseQueryResult<PaginatedResult<Quote>, Error> => {
	return useQuery({
		queryKey: quoteKeys.list(params),
		queryFn: () => getQuotes(params),
		placeholderData: (previousData) => previousData,
	});
};
