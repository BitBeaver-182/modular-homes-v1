import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getQuote } from "../lib/quote-api";
import type { Quote } from "../types";
import { quoteKeys } from "./quote-keys";

export const useGetQuote = (
	documentId: string | undefined | null,
): UseQueryResult<Quote, Error> => {
	return useQuery({
		queryKey: quoteKeys.detail(documentId ?? ""),
		queryFn: () => getQuote(documentId as string),
		enabled: Boolean(documentId),
	});
};
