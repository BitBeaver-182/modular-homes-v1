import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { quoteKeys } from "./quote-keys";
import { getQuote } from "../lib/quote-api";

import type { Quote } from "../types";

export const useGetQuote = (
	documentId: string | undefined | null,
): UseQueryResult<Quote, Error> => {
	return useQuery({
		queryKey: quoteKeys.detail(documentId ?? ""),
		queryFn: () => getQuote(documentId!),
		enabled: Boolean(documentId),
	});
};
