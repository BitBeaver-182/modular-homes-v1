import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";

import { quoteKeys } from "@/features/quotes/hooks/quote-keys";

import { orderKeys } from "../../supplier-orders/hooks/order-keys";
import { createSupplierOrderFromQuote } from "../../supplier-orders/lib/order-api";

import type { SupplierOrder } from "../../supplier-orders/types";

export interface CreateSupplierOrderFromQuoteVariables {
	quoteDocumentId: string;
}

export const useCreateSupplierOrderFromQuote = (): UseMutationResult<
	SupplierOrder,
	Error,
	CreateSupplierOrderFromQuoteVariables
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ quoteDocumentId }: CreateSupplierOrderFromQuoteVariables) =>
			createSupplierOrderFromQuote({ quoteDocumentId }),
		onSuccess: async (_data, variables): Promise<void> => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: orderKeys.lists() }),
				queryClient.invalidateQueries({ queryKey: quoteKeys.all }),
				queryClient.invalidateQueries({
					queryKey: quoteKeys.detail(variables.quoteDocumentId),
				}),
			]);
		},
	});
};
