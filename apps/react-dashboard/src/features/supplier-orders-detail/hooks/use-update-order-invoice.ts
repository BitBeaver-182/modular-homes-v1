import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";

import { orderKeys } from "../../supplier-orders/hooks/order-keys";
import {
	updateSupplierInvoice,
	type SupplierInvoiceUpdateInput,
} from "../lib/order-api";

export interface UpdateOrderInvoiceVariables {
	orderDocumentId: string;
	invoiceDocumentId: string;
	input: SupplierInvoiceUpdateInput;
}

export const useUpdateOrderInvoice = (): UseMutationResult<
	void,
	Error,
	UpdateOrderInvoiceVariables
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ invoiceDocumentId, input }: UpdateOrderInvoiceVariables) =>
			updateSupplierInvoice(invoiceDocumentId, input),
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
