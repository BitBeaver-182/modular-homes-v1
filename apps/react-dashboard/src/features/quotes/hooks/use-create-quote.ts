import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import { createQuote } from "../lib/quote-api";
import type { Quote, QuoteWriteInput } from "../types";
import { quoteKeys } from "./quote-keys";

export const useCreateQuote = (): UseMutationResult<
	Quote,
	Error,
	QuoteWriteInput
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: QuoteWriteInput) => createQuote(input),
		onSuccess: async (): Promise<void> => {
			await queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
		},
	});
};
