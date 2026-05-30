import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { quoteKeys } from "./quote-keys";
import { getQuote } from "../lib/quote-api";

import type { Quote } from "../types";

export const useGetQuote = (
	organizationId: string,
	id: string | undefined | null,
): UseQueryResult<Quote, Error> => {
	return useQuery({
		queryKey: quoteKeys.detail(id ?? ""),
		queryFn: () => getQuote({ organizationId }, id!),
		enabled: Boolean(id),
	});
};
