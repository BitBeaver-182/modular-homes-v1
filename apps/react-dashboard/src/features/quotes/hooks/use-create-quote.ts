import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";

import { quoteKeys } from "./quote-keys";
import { createQuote } from "../lib/quote-api";

import type {
	CreateSupplierQuoteRequest,
	SupplierQuoteResponse,
} from "@moduflow/types";

export const useCreateQuote = (
	organizationId: string
): UseMutationResult<
	SupplierQuoteResponse,
	Error,
	CreateSupplierQuoteRequest
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CreateSupplierQuoteRequest) =>
			createQuote({ organizationId }, input),
		onSuccess: async (): Promise<void> => {
			await queryClient.invalidateQueries({
				queryKey: quoteKeys.lists(organizationId),
			});
		},
	});
};
