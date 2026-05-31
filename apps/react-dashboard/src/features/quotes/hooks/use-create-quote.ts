import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";

import { quoteKeys } from "./quote-keys";
import { createQuote } from "../lib/quote-api";

import type { QuoteWriteInput } from "../types";
import type { SupplierQuoteResponse } from "@moduflow/types";

export const useCreateQuote = (
	organizationId: string
): UseMutationResult<
	SupplierQuoteResponse,
	Error,
	QuoteWriteInput
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: QuoteWriteInput) =>
			createQuote({ organizationId }, input),
		onSuccess: async (): Promise<void> => {
			await queryClient.invalidateQueries({
				queryKey: quoteKeys.lists(organizationId),
			});
		},
	});
};
