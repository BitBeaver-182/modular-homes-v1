import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";

import { orderKeys } from "../../supplier-orders/hooks/order-keys";
import {
	createSupplierInvoice,
	type SupplierInvoiceWriteInput,
} from "../lib/order-api";

export interface CreateOrderInvoiceVariables {
	orderDocumentId: string;
	input: SupplierInvoiceWriteInput;
}

export const useCreateOrderInvoice = (): UseMutationResult<
	void,
	Error,
	CreateOrderInvoiceVariables
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ input }: CreateOrderInvoiceVariables) =>
			createSupplierInvoice(input),
		onSuccess: async (_data, variables): Promise<void> => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: orderKeys.lists() }),
				queryClient.invalidateQueries({
					queryKey: orderKeys.detail(variables.orderDocumentId),
				}),
			]);
		},
	});
};
