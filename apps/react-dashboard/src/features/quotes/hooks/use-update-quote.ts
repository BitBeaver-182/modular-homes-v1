import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";

import { quoteKeys } from "./quote-keys";
import { updateQuote } from "../lib/quote-api";

import type { Quote, QuoteWriteInput } from "../types";

export interface UpdateQuoteVariables {
	documentId: string;
	input: QuoteWriteInput;
}

export const useUpdateQuote = (): UseMutationResult<
	Quote,
	Error,
	UpdateQuoteVariables
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ documentId, input }: UpdateQuoteVariables) =>
			updateQuote(documentId, input),
		onSuccess: async (_data, variables): Promise<void> => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: quoteKeys.lists() }),
				queryClient.invalidateQueries({
					queryKey: quoteKeys.detail(variables.documentId),
				}),
			]);
		},
	});
};
