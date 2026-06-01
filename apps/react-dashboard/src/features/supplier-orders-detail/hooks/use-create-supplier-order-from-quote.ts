import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";

import { quoteKeys } from "@/features/quotes/hooks/quote-keys";

import { orderKeys } from "../../supplier-orders/hooks/order-keys";
import { createSupplierOrderFromQuote } from "../../supplier-orders/lib/order-api";

import type { SupplierOrderListItemResponse } from "@moduflow/types";

export interface CreateSupplierOrderFromQuoteVariables {
	quoteId: string;
}

export const useCreateSupplierOrderFromQuote = (
	organizationId: string
): UseMutationResult<
	SupplierOrderListItemResponse,
	Error,
	CreateSupplierOrderFromQuoteVariables
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ quoteId }: CreateSupplierOrderFromQuoteVariables) =>
			createSupplierOrderFromQuote({ organizationId, quoteId }),
		onSuccess: async (_data, variables): Promise<void> => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: orderKeys.lists() }),
				queryClient.invalidateQueries({
					queryKey: quoteKeys.lists(organizationId),
				}),
				queryClient.invalidateQueries({
					queryKey: quoteKeys.detail(variables.quoteId),
				}),
			]);
		},
	});
};
