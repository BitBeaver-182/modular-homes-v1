import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";

import { quoteKeys } from "./quote-keys";
import { updateQuote } from "../lib/quote-api";

import type {
	SupplierQuoteResponse,
	UpdateSupplierQuoteRequest,
} from "@moduflow/types";

export interface UpdateQuoteVariables {
	id: string;
	input: UpdateSupplierQuoteRequest;
}

export const useUpdateQuote = (
	organizationId: string
): UseMutationResult<
	SupplierQuoteResponse,
	Error,
	UpdateQuoteVariables
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, input }: UpdateQuoteVariables) =>
			updateQuote({ organizationId }, id, input),
		onSuccess: async (_data, variables): Promise<void> => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: quoteKeys.lists(organizationId),
				}),
				queryClient.invalidateQueries({
					queryKey: quoteKeys.detail(variables.id),
				}),
			]);
		},
	});
};
